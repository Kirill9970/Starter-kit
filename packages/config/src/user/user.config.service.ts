import { Injectable } from '@nestjs/common';

import { DEFAULT_USER_CONFIG } from './user.config.default';
import { UserConfig } from './user.config.interface';

@Injectable()
export class UserConfigService {
  private config: UserConfig;

  constructor(data: UserConfig = DEFAULT_USER_CONFIG) {
    this.config = data;
  }

  public loadFromEnv(): void {
    this.config = this.parseConfigFromEnv(process.env);
  }

  private parseConfigFromEnv(env: NodeJS.ProcessEnv): UserConfig {
    return {
      prisma: {
        sharedDatabaseUrl:
          env.SHARED_DATABASE_URL ||
          DEFAULT_USER_CONFIG.prisma.sharedDatabaseUrl,
      },
    };
  }

  public get(): Readonly<UserConfig> {
    return this.config;
  }
}
