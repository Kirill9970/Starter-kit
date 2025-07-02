import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import {
  ClientAuthModule,
  ClientUserModule,
  loadAuthClientOptions,
  loadUserClientOptions,
  RequireConfirmationInterceptor,
  ServiceJwtInterceptor,
  UserClient,
} from '@crypton-nestjs-kit/common';
import {
  ConfigModule,
  ConfigService,
  UserConfigModule,
  UserConfigService,
} from '@crypton-nestjs-kit/config';
import {
  AppLoggerModule,
  LoggingInterceptor,
} from '@crypton-nestjs-kit/logger';
import { SharedPrismaModule } from '@crypton-nestjs-kit/prisma';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';

@Module({
  imports: [
    ConfigModule,
    ClientUserModule.forRoot(loadUserClientOptions()),
    ClientAuthModule.forRoot(loadAuthClientOptions()),
    SharedPrismaModule.forRootAsync({
      imports: [UserConfigModule],
      inject: [UserConfigService],
      useFactory: (cfg: UserConfigService) => ({
        databaseUrl: cfg.get().prisma.sharedDatabaseUrl,
      }),
    }),
    AppLoggerModule,
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
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get().auth.service_secrets.user_service,
        };
      },
      inject: [ConfigService],
    }),
  ],
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useClass: ServiceJwtInterceptor,
    // },
    // {
    //   provide: APP_INTERCEPTOR,
    //   useFactory: (reflector: Reflector, userClient: UserClient) => {
    //     return new RequireConfirmationInterceptor(reflector, userClient);
    //   },
    //   inject: [Reflector, UserClient],
    // },
  ],
})
export class UserModule {}
