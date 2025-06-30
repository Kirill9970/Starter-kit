import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR, Reflector } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ApiKeyEntity,
  ClientUserModule,
  loadUserClientOptions,
  PermissionsRegistrarModule,
  RequireConfirmationInterceptor,
  SessionEntity,
  UserClient,
} from '@crypton-nestjs-kit/common';
import {
  AuthConfigModule,
  AuthConfigService,
  ConfigModule,
  ConfigService,
} from '@crypton-nestjs-kit/config';
import { DBModule } from '@crypton-nestjs-kit/database';
import {
  AppLoggerModule,
  LoggingInterceptor,
} from '@crypton-nestjs-kit/logger';
import { PrismaModule } from '@crypton-nestjs-kit/prisma';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

import { ApiKeyController } from './controllers/api-key.controller';
import { AuthController } from './controllers/auth.controller';
import { ApiKeyService } from './services/api-key/api-key.service';
import { AuthService } from './services/auth/auth.service';
import { AuthStrategyFactory } from './services/auth/auth-strategy-factory.service';
// Стратегии
import { NativeStrategy } from './services/auth/strategies/native.strategy';
import { ServiceJwtUseCase } from './use-cases/service-jwt.use-case';

@Module({
  imports: [
    PermissionsRegistrarModule,
    ConfigModule,
    AppLoggerModule,
    ClientUserModule.forRoot(loadUserClientOptions()),
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
    PrismaModule.forRootAsync({
      imports: [AuthConfigModule],
      inject: [AuthConfigService],
      useFactory: (cfg: AuthConfigService) => ({
        databaseUrl: cfg.get().prisma.databaseUrl,
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
    ServiceJwtUseCase,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
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
