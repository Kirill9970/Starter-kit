import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthClient } from '@crypton-nestjs-kit/common';

@Injectable()
export class AuthOrApiKeyGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authClient: AuthClient,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const secured = this.reflector.get<boolean>(
      'secured',
      context.getHandler(),
    );

    if (!secured) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    const apiKey =
      request.headers['x-api-key'] ||
      request.headers['api-key'] ||
      request.query.apiKey;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      return await this.validateBearerToken(request, authHeader);
    } else if (apiKey) {
      return await this.validateApiKey(request, apiKey);
    } else {
      throw new UnauthorizedException({
        message: 'Unauthorized',
        data: null,
        errors: null,
      });
    }
  }

  private async validateBearerToken(
    request: any,
    authHeader: string,
  ): Promise<boolean> {
    const data = {
      token: authHeader.split(' ')[1],
      userAgent: request.headers['user-agent'] || '',
      userIp: request.headers['x-forwarded-for'] || request.headers.host,
      fingerprint: request.headers['fingerprint'] || '',
      country: request.headers['cf-ipcountry'] || '',
      city: request.headers['cf-ipcity'] || '',
    };
    const tokenInfo = await this.authClient.tokenVerify(
      data,
      request['correlationId'],
      'service',
    );

    if (!tokenInfo.status) {
      throw new UnauthorizedException({
        message: tokenInfo.message,
        data: null,
        errors: null,
      });
    }

    request.user = tokenInfo.user;
    request.sessionId = tokenInfo.sessionId;
    request.serviceToken = tokenInfo.serviceJwt;

    return true;
  }

  private async validateApiKey(request: any, apiKey: string): Promise<boolean> {
    const traceId = request.headers['correlationId'];
    const ip =
      request.headers['x-forwarded-for'] || request.headers.host || request.ip;
    const validatedData = await this.authClient.apiKeyValidate(
      { rawKey: apiKey, ip },
      traceId,
      'api-gateway',
    );

    if (!validatedData.status) {
      throw new ForbiddenException('Invalid API Key');
    }

    request.user = validatedData.user;
    request.serviceToken = validatedData.serviceToken;

    return true;
  }
}
