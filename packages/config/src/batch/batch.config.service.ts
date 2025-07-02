import { Injectable } from '@nestjs/common';

import { DEFAULT_BATCH_CONFIG } from './batch.config.default';
import { BatchConfig } from './batch.config.interface';

@Injectable()
export class BatchConfigService {
  private config: BatchConfig;

  constructor(data: BatchConfig = DEFAULT_BATCH_CONFIG) {
    this.config = data;
  }

  public loadFromEnv(): void {
    this.config = this.parseConfigFromEnv(process.env);
  }

  private parseConfigFromEnv(env: NodeJS.ProcessEnv): BatchConfig {
    return {
      prisma: {
        batchDatabaseUrl:
          env.BATCH_DATABASE_URL ||
          DEFAULT_BATCH_CONFIG.prisma.batchDatabaseUrl,
        sharedDatabaseUrl:
          env.SHARED_DATABASE_URL ||
          DEFAULT_BATCH_CONFIG.prisma.sharedDatabaseUrl,
      },
    };
  }

  public get(): Readonly<BatchConfig> {
    return this.config;
  }
}
