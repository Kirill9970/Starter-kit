import { Injectable } from '@nestjs/common';

import { DEFAULT_WS_COORDINATOR_CONFIG } from './ws-coordinator.config.default';
import { WsCoordinatorConfig } from './ws-coordinator.config.interface';

@Injectable()
export class WsCoordinatorConfigService {
  private config: WsCoordinatorConfig;

  constructor(data: WsCoordinatorConfig = DEFAULT_WS_COORDINATOR_CONFIG) {
    this.config = data;
  }

  public loadFromEnv(): void {
    this.config = this.parseConfigFromEnv(process.env);
  }

  private parseConfigFromEnv(env: NodeJS.ProcessEnv): WsCoordinatorConfig {
    return {
      prisma: {
        wsCoordinatorDatabaseUrl:
          env.WS_COORDINATOR_DATABASE_URL ||
          DEFAULT_WS_COORDINATOR_CONFIG.prisma.wsCoordinatorDatabaseUrl,
      },
    };
  }

  public get(): Readonly<WsCoordinatorConfig> {
    return this.config;
  }
}
