import { BatchConfig } from './batch.config.interface';

export const DEFAULT_BATCH_CONFIG: BatchConfig = {
  prisma: {
    batchDatabaseUrl: '',
    sharedDatabaseUrl: '',
  },
};
