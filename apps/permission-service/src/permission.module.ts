import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ClientUserModule,
  loadUserClientOptions,
  PermissionEntity,
  RoleEntity,
  TwoFactorPermissionsEntity,
  UserEntity,
  UserLoginMethodsEntity,
  UserRoleEntity,
} from '@crypton-nestjs-kit/common';
import { ConfigModule, ConfigService } from '@crypton-nestjs-kit/config';
import { DBModule } from '@crypton-nestjs-kit/database';
import {
  AppLoggerModule,
  LoggingInterceptor,
} from '@crypton-nestjs-kit/logger';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

import { PermissionController } from './controllers/permission.controller';
import { PermissionService } from './services/permission.service';

@Module({
  imports: [
    ConfigModule,
    ClientUserModule.forRoot(loadUserClientOptions()),
    TypeOrmModule.forFeature([
      UserEntity,
      UserLoginMethodsEntity,
      RoleEntity,
      UserRoleEntity,
      PermissionEntity,
      TwoFactorPermissionsEntity,
    ]),
    DBModule.forRoot({
      entities: [
        UserEntity,
        UserLoginMethodsEntity,
        RoleEntity,
        UserRoleEntity,
        PermissionEntity,
        TwoFactorPermissionsEntity,
      ],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
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
  controllers: [PermissionController],
  providers: [
    PermissionService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class PermissionModule {}
