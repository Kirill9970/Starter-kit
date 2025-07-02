import { CacheModule } from '@nestjs/cache-manager';
import { Module, OnModuleInit, RequestMethod } from '@nestjs/common';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  DiscoveryService,
  Reflector,
} from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerModule } from '@nestjs/throttler';
import {
  ClientAuthModule,
  ClientUserModule,
  GlobalExceptionFilter,
  loadAuthClientOptions,
  loadUserClientOptions,
  UserClient,
} from '@crypton-nestjs-kit/common';
import { ConfigModule, ConfigService } from '@crypton-nestjs-kit/config';
import { AppLoggerModule } from '@crypton-nestjs-kit/logger';
import { redisStore } from 'cache-manager-redis-yet';
import { ThrottlerStorageRedisService } from 'nestjs-throttler-storage-redis';
import { RedisClientOptions } from 'redis';

import { AuthOrApiKeyGuard } from './guards/authorization.guard';
import { BruteForceGuard } from './guards/bruteForce.guard';
import { CaptchaGuard } from './guards/captcha.guard';
import { CustomThrottlerGuard } from './guards/custom-throttler.guard';
import { BaseCodeBruteForceGuard } from './guards/twoFA.guard';
import { AuthController } from './v1/auth/auth.controller';
import { CaptchaService } from './v1/auth/services/captcha.service';
import { SessionsController } from './v1/auth/sessions.controller';
import { UserController } from './v1/user/user.controller';
import { GatewayController } from './gateway.controller';
import { TransformResponseInterceptor } from './interceptors';
import { ApiKeyController } from './v1';

@Module({
  imports: [
    ConfigModule,
    AppLoggerModule,
    TerminusModule,
    ClientAuthModule.forRoot(loadAuthClientOptions()),
    ClientUserModule.forRoot(loadUserClientOptions()),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const throttler_options = configService.get().throttler;

        return {
          throttlers: [
            {
              ttl: throttler_options.ttl,
              limit: throttler_options.limit,
            },
          ],
          storage: new ThrottlerStorageRedisService(
            configService.get().redisCache.url,
          ),
        };
      },
    }),
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],

      useFactory: async (configService: ConfigService) => {
        const redis = configService.get().redisCache;

        return {
          store: redisStore,
          url: redis.url,
        } as RedisClientOptions;
      },
    }),
  ],
  controllers: [
    AuthController,
    ApiKeyController,
    SessionsController,
    GatewayController,
    UserController,
  ],
  providers: [
    BruteForceGuard,
    BaseCodeBruteForceGuard,
    DiscoveryService,
    Reflector,
    CustomThrottlerGuard,
    CaptchaService,
    CaptchaGuard,
    {
      provide: APP_GUARD,
      useClass: AuthOrApiKeyGuard,
    },
    // {
    //   provide: APP_GUARD,
    //   useClass: CustomThrottlerGuard,
    // },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
})
export class GatewayModule {}

// export class GatewayModule implements OnModuleInit {
//   constructor(
//     private readonly discoveryService: DiscoveryService,
//     private readonly userClient: UserClient,
//   ) {}
//
//   async onModuleInit(): Promise<void> {
//     try {
//       const { permissions } = await this.userClient.getPermissionList(
//         '5555555',
//       );
//       const permissionsList = this.extractPermissionsFromControllers();
//
//       const updatedPermissions = this.filterUpdatedPermissions(
//         permissionsList,
//         permissions,
//       );
//
//       if (updatedPermissions.length > 0) {
//         await this.userClient.registerPermissions(
//           { permissions: updatedPermissions },
//           '5555555',
//         );
//       }
//     } catch (e) {
//       console.log('Failed to register permissions', e.message);
//     }
//   }
//
//   private extractPermissionsFromControllers(): Array<{
//     route: string;
//     method: string;
//     alias: string;
//     description: string;
//   }> {
//     const controllers = this.discoveryService.getControllers();
//     const permissionsList: Array<{
//       route: string;
//       method: string;
//       alias: string;
//       description: string;
//     }> = [];
//
//     for (const controller of controllers) {
//       const instance = controller.instance;
//       const prototype = Object.getPrototypeOf(instance);
//       const controllerPath =
//         Reflect.getMetadata('path', controller.metatype) || '';
//
//       const methods = Object.getOwnPropertyNames(prototype).filter(
//         (method) => typeof instance[method] === 'function',
//       );
//
//       for (const method of methods) {
//         const routePath = Reflect.getMetadata('path', prototype[method]);
//         const requestMethod = Reflect.getMetadata('method', prototype[method]);
//
//         if (!routePath || requestMethod === undefined) continue;
//
//         const methodType = RequestMethod[requestMethod];
//         const fullPath = `/${controllerPath}/${routePath}`.replace(/\/+/g, '/');
//         const alias = this.generateRouteAlias(methodType, fullPath);
//         const description = this.getApiPropertyDescription(prototype, method);
//
//         permissionsList.push({
//           route: fullPath,
//           alias,
//           description,
//           method: methodType,
//         });
//       }
//     }
//
//     return permissionsList;
//   }
//
//   private filterUpdatedPermissions(
//     permissionsList: Array<{
//       route: string;
//       method: string;
//       alias: string;
//       description: string;
//     }>,
//     existingPermissions: Array<{
//       route: string;
//       method: string;
//       alias: string;
//       description: string;
//     }>,
//   ): Array<{
//     route: string;
//     method: string;
//     alias: string;
//     description: string;
//   }> {
//     return permissionsList.filter((permission) => {
//       const existingPermission = existingPermissions.find(
//         (p) => p.alias === permission.alias,
//       );
//
//       return (
//         !existingPermission ||
//         existingPermission.method !== permission.method ||
//         existingPermission.route !== permission.route ||
//         existingPermission.description !== permission.description
//       );
//     });
//   }
//
//   private generateRouteAlias(method: string, route: string): string {
//     return route
//       .replace(/^\/|\/$/g, '')
//       .replace(/\/+/g, '_')
//       .replace(/_+/g, '_')
//       .concat(`_${method.toLowerCase()}`);
//   }
//
//   private getApiPropertyDescription(
//     prototype: any,
//     method: string,
//   ): string | null {
//     const descriptor = Object.getOwnPropertyDescriptor(prototype, method);
//     const originalMethod = descriptor?.value || prototype[method];
//     const metadata = Reflect.getMetadata(
//       'swagger/apiOperation',
//       originalMethod,
//     );
//
//     return metadata?.description || null;
//   }
// }
