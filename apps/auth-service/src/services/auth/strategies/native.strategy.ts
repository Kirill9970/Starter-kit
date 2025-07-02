import { Injectable } from '@nestjs/common';
import {
  AUTH_ERROR_CODES,
  AuthenticationError,
  AuthErrorMessages,
  IAuthStrategy,
  INativeAuthCredentials,
  ServiceJwtGenerator,
  UserClient,
} from '@crypton-nestjs-kit/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class NativeStrategy implements IAuthStrategy {
  constructor(
    private readonly userClient: UserClient,
    private readonly serviceJwtGenerator: ServiceJwtGenerator,
  ) {}

  async authenticate(
    credentials: INativeAuthCredentials,
    traceId?: string,
  ): Promise<any> {
    try {
      const serviceToken = await this.serviceJwtGenerator.generateServiceJwt({
        subject: credentials.login,
        actor: 'auth-service',
        issuer: 'auth-service',
        audience: 'user',
        type: 'service',
        expiresIn: '5m',
      });

      const userResult = await this.userClient.getUserByLogin(
        { login: credentials.login },
        traceId,
        serviceToken,
      );

      if (!userResult.user) {
        throw new AuthenticationError(
          'User not found',
          AUTH_ERROR_CODES.USER_NOT_FOUND,
        );
      }

      const isPasswordValid = await bcrypt.compare(
        credentials.password,
        userResult.user.password,
      );

      if (!isPasswordValid) {
        throw new AuthenticationError(
          AuthErrorMessages[AUTH_ERROR_CODES.INVALID_CREDENTIALS],
          AUTH_ERROR_CODES.INVALID_CREDENTIALS,
        );
      }

      return {
        status: true,
        message: 'Native authentication successful',
        user: {
          id: userResult.user.id,
          name: userResult.user.fullName,
        },
      };
    } catch (error) {
      let errorCode = AUTH_ERROR_CODES.AUTHENTICATION_FAILED;
      let errorMessage = error.message;

      if (error instanceof AuthenticationError) {
        errorCode = error.code as AUTH_ERROR_CODES;
        errorMessage = null;
      }

      return {
        status: false,
        message: error.message,
        error: errorMessage,
        user: null,
        errorCode,
      };
    }
  }

  validateToken(_token: string): Promise<any> {
    return Promise.resolve({
      status: false,
      message: 'Not implemented',
      error: 'Not implemented',
      errorCode: AUTH_ERROR_CODES.UNKNOWN_ERROR,
    });
  }
}
