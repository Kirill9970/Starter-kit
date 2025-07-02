import { Module } from '@nestjs/common';

import { BatchConfigService } from './batch.config.service';

const configFactory = {
  provide: BatchConfigService,
  useFactory: (): BatchConfigService => {
    const config = new BatchConfigService();

    config.loadFromEnv();

    return config;
  },
};

@Module({
  providers: [configFactory],
  exports: [configFactory],
})
export class BatchConfigModule {}
