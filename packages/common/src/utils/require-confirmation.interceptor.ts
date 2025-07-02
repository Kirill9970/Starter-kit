import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATTERN_METADATA } from '@nestjs/microservices/constants';
import { from, Observable, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

import { UserClient } from '../clients';
import { AUTH_ERROR_CODES, AuthErrorMessages } from '../errors';

import { CONTROLLER_META, ControllerType } from './controller-meta.decorator';

@Injectable()
export class RequireConfirmationInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    private readonly userClient: UserClient,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return from(this.handle(context, next)).pipe(
      switchMap((result) => result),
      catchError((err) => {
        return this.errorResponse(
          AUTH_ERROR_CODES.UNKNOWN_ERROR,
          (err as Error).message,
        );
      }),
    );
  }

  private async handle(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    try {
      const messagePattern = this.reflector.get<string>(
        PATTERN_METADATA,
        context.getHandler(),
      );

      const controllerMeta = this.reflector.get<{
        name: string;
        isPublic: boolean;
        description: string;
        type: string;
        needsConfirmation: boolean;
      }>(CONTROLLER_META, context.getHandler());

      if (
        !controllerMeta ||
        !controllerMeta.isPublic ||
        !controllerMeta.type ||
        controllerMeta.type == ControllerType.READ ||
        controllerMeta.needsConfirmation === false
      ) {
        return next.handle();
      }

      if (!messagePattern) {
        return next.handle();
      }

      const rpcData = context.switchToRpc().getData();
      const properties = context.getArgs()[1].args[0].properties;
      const headers = properties.headers || {};
      const serviceTokenPrefix = headers['x-service-token']?.split('____')[0];
      const serviceToken = headers['x-service-token']?.split('____')[1];
      const traceId = headers.traceId || rpcData?.traceId || 'service';

      if (serviceTokenPrefix === 'api-key') {
        return next.handle();
      }

      const permissionData = await this.userClient.getPermissionsByPattern(
        messagePattern[0],
        traceId,
        serviceToken,
      );

      if (!permissionData.status) {
        return of({
          status: false,
          error: 'PERMISSION_DATA_NOT_FOUND',
          message: 'Permission data not found',
        });
      }

      let userId = rpcData?.userId;
      const login = rpcData?.credentials?.login;
      const confirmationCodes =
        rpcData?.twoFaCodes || rpcData?.credentials?.twoFaCodes;

      if (!userId && !login) {
        return this.errorResponse(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
      }

      if (!userId) {
        const data = await this.userClient.getUserByLoginSecure(
          { login },
          traceId,
          serviceToken,
        );

        if (!data.status) {
          return this.errorResponse(AUTH_ERROR_CODES.INVALID_CREDENTIALS);
        }

        userId = data.user.id;
      }

      const data = await this.userClient.getUserByIdService(
        { userId },
        traceId,
        serviceToken,
      );

      const twoFaEntries = data.user.twoFaPermissions.filter(
        (entry: any) => entry.permission.id === permissionData.permission.id,
      );

      const twoFaPermissionIds = new Set(
        twoFaEntries.map((e: any) => e.confirmationMethod?.id),
      );

      const confirmationMethods = data.user.loginMethods.filter((entry: any) =>
        twoFaPermissionIds.has(entry.id),
      );

      if (confirmationMethods.length < 1) {
        return next.handle();
      }

      for (const entry of confirmationMethods) {
        const method = entry?.method;

        if (!method) continue;

        const expectedCode = confirmationCodes?.[`${method}Code`];

        if (!expectedCode) {
          return this.errorResponse(AUTH_ERROR_CODES.MISSING_CONFIRMATION_CODE);
        }

        const codeLifetime = new Date(entry.codeLifetime);
        const currentTime = new Date();

        const normalizedEntryCode = String(entry.code).trim();
        const normalizedExpectedCode = String(expectedCode).trim();

        if (normalizedEntryCode !== normalizedExpectedCode) {
          return this.errorResponse(AUTH_ERROR_CODES.INVALID_CONFIRMATION_CODE);
        }

        if (currentTime.getTime() > codeLifetime.getTime()) {
          return this.errorResponse(AUTH_ERROR_CODES.EXPIRED_CONFIRMATION_CODE);
        }

        await this.userClient.resetConfirmationCode(
          { id: entry.id },
          traceId,
          serviceToken,
        );
      }

      return next.handle();
    } catch (err) {
      return this.errorResponse(
        AUTH_ERROR_CODES.UNKNOWN_ERROR,
        (err as Error).message,
      );
    }
  }

  private errorResponse(code: AUTH_ERROR_CODES, message?: string) {
    return of({
      status: false,
      errorCode: code,
      message: message || AuthErrorMessages[code],
    });
  }
}
