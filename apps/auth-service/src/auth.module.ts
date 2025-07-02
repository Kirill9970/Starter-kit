import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApiKeyEntity,
  ClientPermissionModule,
  ClientUserModule,
  loadPermissionClientOptions,
  loadUserClientOptions,
  PermissionsRegistrarModule,
  RequireConfirmationInterceptor,
  ServiceJwtGenerator,
  ServiceJwtInterceptor,
  SessionEntity,
  UserClient,
} from '@crypton-nestjs-kit/common';
import {
  AuthConfigModule,
  AuthConfigService,
  ConfigModule,
  ConfigService,
} from '@crypton-nestjs-kit/config';
import {
  AppLoggerModule,
  LoggingInterceptor,
} from '@crypton-nestjs-kit/logger';
import { SharedPrismaModule } from '@crypton-nestjs-kit/prisma';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

import { ApiKeyController } from './controllers/api-key.controller';
import { AuthController } from './controllers/auth.controller';
import { ApiKeyService } from './services/api-key/api-key.service';
import { AuthService } from './services/auth/auth.service';
import { AuthStrategyFactory } from './services/auth/auth-strategy-factory.service';
// Стратегии
import { NativeStrategy } from './services/auth/strategies/native.strategy';

@Module({
  imports: [
    PermissionsRegistrarModule,
    ConfigModule,
    AppLoggerModule,
    ClientUserModule.forRoot(loadUserClientOptions()),
    ClientPermissionModule.forRoot(loadPermissionClientOptions()),
    TypeOrmModule.forFeature([SessionEntity, ApiKeyEntity]),
    DBModule.forRoot({
      entities: [SessionEntity, ApiKeyEntity],
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get().auth.token_secret,
        };
      },
      inject: [ConfigService],
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
    SharedPrismaModule.forRootAsync({
      imports: [AuthConfigModule],
      inject: [AuthConfigService],
      useFactory: (cfg: AuthConfigService) => ({
        databaseUrl: cfg.get().prisma.sharedDatabaseUrl,
      }),
    }),
  ],
  controllers: [AuthController, ApiKeyController],
  providers: [
    AuthStrategyFactory,
    AuthService,
    ApiKeyService,
    // Strategy's
    NativeStrategy,
    // Use cases
    ServiceJwtGenerator,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ServiceJwtInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useFactory: (reflector: Reflector, userClient: UserClient) => {
        return new RequireConfirmationInterceptor(reflector, userClient);
      },
      inject: [Reflector, UserClient],
    },
  ],
})
export class AuthModule {}
