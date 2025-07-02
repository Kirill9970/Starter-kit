import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthClient } from '@crypton-nestjs-kit/common';
import { ConfigService } from '@crypton-nestjs-kit/config';

import { API_KEY_METADATA } from '../decorators/api-key.decorator';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly authClient: AuthClient) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const providedApiKey =
      request.headers['x-api-key'] ||
      request.headers['api-key'] ||
      request.query.apiKey;

    const traceId = request.headers['correlationId'];
    const ip =
      request.headers['x-forwarded-for'] || request.headers.host || request.ip;

    const validatedData = await this.authClient.apiKeyValidate(
      { rawKey: providedApiKey, ip },
      traceId,
      'api-gateway',
    );

    if (!validatedData.status) {
      throw new ForbiddenException('Invalid API Key');
    }

    return true;
  }
}
