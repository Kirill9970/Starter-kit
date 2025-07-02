import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { PATTERN_METADATA } from '@nestjs/microservices/constants';
import { ConfigService } from '@crypton-nestjs-kit/config';
import { Observable, of, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AUTH_ERROR_CODES, AuthErrorMessages } from '../errors';

import {
  CONTROLLER_META,
  ControllerMetaOptions,
} from './controller-meta.decorator';

@Injectable()
export class ServiceJwtInterceptor implements NestInterceptor {
  private readonly serviceSecrets: Record<string, string>;
  constructor(
    @Inject(Reflector)
    private readonly reflector: Reflector,
    @Inject(JwtService)
    private readonly jwtService: JwtService,
    @Inject(ConfigService)
    private readonly configService: ConfigService,
  ) {
    this.serviceSecrets = this.configService.get().auth.service_secrets;
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const contextType = context.getType();
    const handler = context.getHandler();

    const controllerMeta = this.reflector.get<ControllerMetaOptions>(
      CONTROLLER_META,
      context.getHandler(),
    );

    if (controllerMeta?.needsPermission === false) {
      return next.handle();
    }

    let { serviceToken } = this.extractContextData(context, contextType);
    const serviceTokenPrefix = serviceToken.split('____')[0];

    serviceToken = serviceToken.split('____')[1];

    if (!serviceToken) {
      return of({
        status: false,
        errorCode: AUTH_ERROR_CODES.ACCESS_DENIED,
        message: AuthErrorMessages[AUTH_ERROR_CODES.ACCESS_DENIED] + '1',
      });
    }

    let decodedData: any;

    try {
      decodedData = this.jwtService.decode(serviceToken);
      const secret = this.resolveSecret(decodedData.aud);

      this.jwtService.verify(String(serviceToken), {
        secret,
        algorithms: ['HS256'],
      });
    } catch (err) {
      console.log((err as Error).message);

      return of({
        status: false,
        errorCode: AUTH_ERROR_CODES.ACCESS_DENIED,
        message: AuthErrorMessages[AUTH_ERROR_CODES.ACCESS_DENIED] + '2',
      });
    }

    if (decodedData.typ === 'access' || serviceTokenPrefix === 'api-key') {
      if (
        !this.hasScope(
          decodedData.scope,
          this.reflector.get<string>(PATTERN_METADATA, handler),
        )
      ) {
        return of({
          status: false,
          errorCode: AUTH_ERROR_CODES.ACCESS_DENIED,
          message: AuthErrorMessages[AUTH_ERROR_CODES.ACCESS_DENIED] + '3',
        });
      }
    }

    return next.handle().pipe(catchError((err) => throwError(() => err)));
  }
  private resolveSecret(aud: string): string {
    return (
      this.serviceSecrets[aud] ||
      this.serviceSecrets[`${aud}_service`] ||
      this.serviceSecrets.default
    );
  }

  private hasScope(scope: any, messagePattern: string): boolean {
    if (!Array.isArray(scope) || !messagePattern) return false;

    const patternSet = new Set<string>(
      scope
        .map((s: string) => {
          return s;
        })
        .filter((v): v is string => typeof v === 'string'),
    );

    return patternSet.has(messagePattern[0]);
  }

  private extractContextData(
    context: ExecutionContext,
    contextType: string,
  ): { serviceToken: string } {
    if (contextType === 'http') {
      const request = context.switchToHttp().getRequest();

      return {
        serviceToken: request.headers['x-service-token'],
      };
    } else {
      const args = context.getArgs()[0];

      const properties = context.getArgs()[1].args[0].properties;
      const headers = properties.headers || {};
      const serviceToken =
        headers['x-service-token'] || args['x-service-token'];

      return {
        serviceToken,
      };
    }
  }
}
