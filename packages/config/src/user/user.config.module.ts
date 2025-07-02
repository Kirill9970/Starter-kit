import { Module } from '@nestjs/common';

import { UserConfigService } from './user.config.service';

const configFactory = {
  provide: UserConfigService,
  useFactory: (): UserConfigService => {
    const config = new UserConfigService();

    config.loadFromEnv();

    return config;
  },
};

@Module({
  providers: [configFactory],
  exports: [configFactory],
})
export class UserConfigModule {}
