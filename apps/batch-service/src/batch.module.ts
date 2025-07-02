import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';
import {
  BatchConfigModule,
  BatchConfigService,
  ConfigModule,
  ConfigService,
} from '@crypton-nestjs-kit/config';
import { AppLoggerModule } from '@crypton-nestjs-kit/logger';
import {
  BatchPrismaModule,
  SharedPrismaModule,
} from '@crypton-nestjs-kit/prisma';
import { SettingModule } from '@crypton-nestjs-kit/settings';
import { redisStore } from 'cache-manager-redis-yet';
import { RedisClientOptions } from 'redis';

import { BatchController } from './controllers/batch.controller';
import { BatchService } from './services/batch.service';
import { BatchWorker } from './services/batch.worker';
import { WorkerService } from './services/worker.service';

@Module({
  imports: [
    ConfigModule,
    AppLoggerModule,
    BatchPrismaModule.forRootAsync({
      imports: [BatchConfigModule],
      inject: [BatchConfigService],
      useFactory: (cfg: BatchConfigService) => ({
        databaseUrl: cfg.get().prisma.batchDatabaseUrl,
      }),
    }),
    SharedPrismaModule.forRootAsync({
      imports: [BatchConfigModule],
      inject: [BatchConfigService],
      useFactory: (cfg: BatchConfigService) => ({
        databaseUrl: cfg.get().prisma.sharedDatabaseUrl,
      }),
    }),
    SettingModule,
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
