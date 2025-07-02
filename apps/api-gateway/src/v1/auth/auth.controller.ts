import {
  Body,
  Controller,
  Headers,
  Injectable,
  Post,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AuthClient, UserClient } from '@crypton-nestjs-kit/common';
import { Request } from 'express';

import { Authorization } from '../../decorators/authorization.decorator';
import { CorrelationIdFromRequest } from '../../decorators/correlation-id-from-request.decorator';
import { RequestIpFromRequest } from '../../decorators/extract-ip.decorator';
import { RequestUserAgentFromRequest } from '../../decorators/extract-userAgent.decorator';
import { CheckPermissions } from '../../decorators/role-permissions-decorator';
import { ServiceTokenFromRequest } from '../../decorators/service-token-from-request.decorator';
import { SessionIdFromRequest } from '../../decorators/sessionId-from-request.decorator';
import { UserIdFromRequest } from '../../decorators/user-id-from-request.decorator';
import { BruteForceGuard } from '../../guards/bruteForce.guard';
import { CaptchaGuard } from '../../guards/captcha.guard';
import { BaseCodeBruteForceGuard } from '../../guards/twoFA.guard';
import { LoginValidationPipe } from '../../pipes/login-validator.pipe';

import {
  ApiResponses,
  AuthDtoRequest,
  ConfirmationCodesRequest,
  RefreshTokenDtoRequest,
  RegisterConfirmRequestDTO,
  RegisterDtoRequest,
} from './dto/auth.dto';
import {
  AccountConfirmationFailedException,
  AuthenticationFailedException,
  RegistrationFailedException,
} from './exceptions/auth.exceptions';
import {
  IAuthResponse,
  IConfirmationResponse,
  IRegistrationResponse,
} from './interfaces/auth.interfaces';

// TODO: Структурировать и привести к общему виду сваггер документацию
/**
 * Authentication and Authorization Controller
 *
 * Handles all operations related to:
 * - User Registration
 * - Account Confirmation
 * - Authentication (including OAuth)
 * - Session Management
 */
@Injectable()
@ApiTags('Auth')
@Controller('v1/auth')
export class AuthController {
  constructor(
    private readonly userClient: UserClient,
    private readonly authClient: AuthClient,
    private readonly bruteForceGuard: BruteForceGuard,
    private readonly codeBruteForceGuard: BaseCodeBruteForceGuard,
  ) {}

  /**
   * Register a new user
   *
   * @param trace_id - Request tracking identifier
   * @param body - Registration data
   * @returns Created user information
   */
  @ApiOperation({
    summary: 'Register a new user',
    description: `
      Creates a new user in the system.
      - Checks if user exists
      - Creates user account
      - Sends confirmation code via email
      
      Account confirmation is required after successful registration.
    `,
  })
  @ApiResponse(ApiResponses.created)
  @ApiResponse(ApiResponses.badRequest)
  @ApiResponse(ApiResponses.notFound)
  @ApiResponse(ApiResponses.internalServerError)
  @CheckPermissions(false)
  @UsePipes(LoginValidationPipe)
  @Post('signup')
  async register(
    @CorrelationIdFromRequest() trace_id: string,
    @Body() body: RegisterDtoRequest,
  ): Promise<IRegistrationResponse> {
    const userData = await this.userClient.findOrCreateUser(
      {
        password: body.password,
        login: body.login,
        loginType: body['loginType'],
      },
      trace_id,
      'service',
    );

    if (!userData.status) {
      throw new RegistrationFailedException();
    }

    if (userData.status && !userData.created) {
      throw new RegistrationFailedException();
    }

    return {
      message: 'User registration in process',
      data: userData.user,
    };
  }

  /**
   * Confirm user account registration
   *
   * @param req - Express request object
   * @param traceId - Request tracking identifier
   * @param body - Confirmation data with code
   * @returns Confirmation result
   */
  @ApiOperation({
    summary: 'Confirm account registration',
    description: `
      Confirms user registration using verification code.
      - Validates confirmation code
      - Activates user account
      - Protected against brute force attacks
      
      After successful confirmation, the account becomes active.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Account successfully confirmed',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid confirmation code',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts. Try again later',
  })
  @UseGuards(BaseCodeBruteForceGuard)
  @Post('signup/confirm')
  async registerConfirm(
    @Req() req: Request,
    @CorrelationIdFromRequest() traceId: string,
    @Body() body: RegisterConfirmRequestDTO,
  ): Promise<IConfirmationResponse> {
    const data = await this.userClient.registrationConfirm(
      {
        code: body.code,
        login: body.login,
      },
      traceId,
      'api-gateway',
    );

    if (!data.status) {
      await this.codeBruteForceGuard.registerFailedAttempt(req);

      throw new AccountConfirmationFailedException();
    }

    await this.codeBruteForceGuard.resetAttempts(req);

    return {
      message: 'Account successfully confirmed',
    };
  }

  /**
   * Authenticate user
   *
   * @param traceId - Request tracking identifier
   * @param requestIp - User's IP address
   * @param user_agent - User's browser/client information
   * @param serviceToken
   * @param body - Authentication credentials
   * @param headers - Request headers containing security information
   * @returns Authentication result with tokens
   */
  @ApiOperation({
    summary: 'Sign in to the system',
    description: `
      Authenticates user in the system.
      - Validates credentials
      - Verifies captcha
      - Supports 2FA
      - Creates user session
      - Returns access tokens
      - Protected against brute force attacks
      
      Successful authentication provides access and refresh tokens.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully authenticated',
    schema: {
      properties: {
        message: { type: 'string', example: 'User successfully authenticated' },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts. Try again later',
  })
  @UseGuards(BruteForceGuard, CaptchaGuard)
  @UsePipes(LoginValidationPipe)
  @Post('signin')
  async auth(
    @CorrelationIdFromRequest() traceId: string,
    @RequestIpFromRequest() requestIp: string,
    @RequestUserAgentFromRequest() user_agent: string,
    @Body() body: AuthDtoRequest,
    @Headers() headers: Record<string, string>,
  ): Promise<IAuthResponse> {
    await this.bruteForceGuard.resetAttempts(requestIp, body.login);
    const userData = await this.authClient.authenticateNative(
      {
        credentials: {
          password: body.password,
          login: body.login,
          loginType: body['loginType'],
          twoFaCodes: body.twoFaCodes,
        },
        sessionData: {
          userAgent: user_agent,
          userIp: requestIp,
          fingerprint: headers['fingerprint'] || '',
          country: headers['cf-ipcountry'] || '',
          city: headers['cf-ipcity'] || '',
        },
      },
      traceId,
      'api-gateway',
    );

    if (!userData.status) {
      await this.bruteForceGuard.registerFailedAttempt(requestIp, body.login);

      throw new AuthenticationFailedException();
    }

    await this.bruteForceGuard.resetAttempts(requestIp, body.login);

    return {
      message: 'User successfully authenticated',
      tokens: userData['tokens'],
    };
  }

  /**
   * Refresh access token using refresh token
   *
   * @param body - Refresh token data
   * @param traceId
   * @returns New access token
   */
  @ApiOperation({
    summary: 'Refresh access token',
    description: `
      Refreshes the access token using a valid refresh token.
      - Validates refresh token
      - Returns new access token
      - Maintains session continuity
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Token successfully refreshed',
    schema: {
      properties: {
        message: { type: 'string', example: 'Token successfully refreshed' },
        tokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid refresh token',
  })
  @Post('tokens/refresh')
  async refreshToken(
    @Body() body: RefreshTokenDtoRequest,
    @CorrelationIdFromRequest() traceId: string,
  ): Promise<IAuthResponse> {
    const result = await this.authClient.refreshToken(
      {
        token: body.refreshToken,
      },
      traceId,
      'api-gateway',
    );

    if (!result.status) {
      throw new AuthenticationFailedException();
    }

    return {
      message: 'Token successfully refreshed',
      tokens: result.tokens,
    };
  }

  /**
   * Logout user and terminate session
   *
   * @param traceId - Request tracking identifier
   * @param userId - User ID from request
   * @param sessionId
   * @param serviceToken
   * @returns Logout result
   */
  @ApiOperation({
    summary: 'Logout user',
    description: `
      Logs out the user and terminates the current session.
      - Invalidates current session
      - Clears user authentication state
      - Requires valid authentication
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiBearerAuth()
  @Authorization(true)
  @Post('logout')
  async logout(
    @CorrelationIdFromRequest() traceId: string,
    @UserIdFromRequest() userId: string,
    @SessionIdFromRequest() sessionId: string,
    @ServiceTokenFromRequest() serviceToken: string,
  ): Promise<{ message: string }> {
    const result = await this.authClient.terminateSessionById(
      traceId,
      serviceToken,
      {
        userId,
        sessionId,
      },
    );

    if (!result.status) {
      throw new AuthenticationFailedException();
    }

    return {
      message: 'Successfully logged out',
    };
  }

  /**
   * Request confirmation codes for 2FA
   *
   * @param traceId - Request tracking identifier
   * @param userId - User ID from request
   * @param body - Confirmation codes request data
   * @returns Confirmation codes result
   */
  @ApiOperation({
    summary: 'Request confirmation codes',
    description: `
      Requests confirmation codes for two-factor authentication.
      - Validates user permissions
      - Sends confirmation codes via configured methods
      - Protected against brute force attacks
      - Required for operations with 2FA enabled
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Confirmation codes sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request or user not found',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many attempts. Try again later',
  })
  @UseGuards(BaseCodeBruteForceGuard)
  @Post('confirmation-codes/request')
  async requestConfirmationCodes(
    @CorrelationIdFromRequest() traceId: string,
    @Body() body: ConfirmationCodesRequest,
  ): Promise<{ message: string; data: any }> {
    const userData = await this.userClient.getUserByLoginSecure(
      {
        login: body.login,
      },
      traceId,
      'api-gateway',
    );

    const result = await this.userClient.createConfirmationCode(
      {
        userId: userData.user.id,
        permissionId: 'authenticateNative',
      },
      traceId,
      'api-gateway',
    );

    if (!result.status) {
      throw new AuthenticationFailedException();
    }

    return {
      message: 'Confirmation codes sent successfully',
      data: result.confirmationMethods,
    };
  }
}
