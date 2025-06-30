import { Module } from '@nestjs/common';

import { AuthConfigService } from './auth.config.service';

const configFactory = {
  provide: AuthConfigService,
  useFactory: (): AuthConfigService => {
    const config = new AuthConfigService();

    config.loadFromEnv();

    return config;
  },
};

@Module({
  providers: [configFactory],
  exports: [configFactory],
})
export class AuthConfigModule {}
