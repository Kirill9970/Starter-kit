import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OperationEntity } from '@crypton-nestjs-kit/common';
import { ConfigModule, ConfigService } from '@crypton-nestjs-kit/config';
import { DBModule } from '@crypton-nestjs-kit/database';
import { AppLoggerModule } from '@crypton-nestjs-kit/logger';
import { SettingModule, SettingsEntity } from '@crypton-nestjs-kit/settings';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

import { BatchController } from './controllers/batch.controller';
import { BATCH_CONNECTION_NAME } from './services/batch.constants';
import { BatchService } from './services/batch.service';
import { BatchWorker } from './services/batch.worker';
import { WorkerService } from './services/worker.service';

@Module({
  imports: [
    ConfigModule,
    AppLoggerModule,
    SettingModule,
    DBModule.forRoot({ entities: [SettingsEntity, OperationEntity] }),
    TypeOrmModule.forRootAsync({
      name: BATCH_CONNECTION_NAME,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const config = configService.get().batchService.db;

        return {
          name: BATCH_CONNECTION_NAME,
          type: 'postgres',
          host: config.host,
          port: config.port,
          username: config.username,
          password: config.password,
          database: config.database,
          synchronize: true,
          entities: [OperationEntity],
          ssl: config.ssl,
          extra: {
            connectionLimit: 15000,
            max: 20,
            min: 1,
          },
          poolSize: 15000,
          logging: false,
          keepConnectionAlive: true,
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([OperationEntity], BATCH_CONNECTION_NAME),
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
  controllers: [BatchController],
  providers: [BatchService, BatchWorker, WorkerService],
})
export class BatchModule {}
