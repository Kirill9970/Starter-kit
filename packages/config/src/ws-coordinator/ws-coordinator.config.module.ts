import { Module } from '@nestjs/common';

import { WsCoordinatorConfigService } from './ws-coordinator.config.service';

const configFactory = {
  provide: WsCoordinatorConfigService,
  useFactory: (): WsCoordinatorConfigService => {
    const config = new WsCoordinatorConfigService();

    config.loadFromEnv();

    return config;
  },
};

@Module({
  providers: [configFactory],
  exports: [configFactory],
})
export class WsCoordinatorConfigModule {}
