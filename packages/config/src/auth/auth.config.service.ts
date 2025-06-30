import { Injectable } from '@nestjs/common';

import { DEFAULT_AUTH_CONFIG } from './auth.config.default';
import { AuthConfig } from './auth.config.interface';

@Injectable()
export class AuthConfigService {
  private config: AuthConfig;

  constructor(data: AuthConfig = DEFAULT_AUTH_CONFIG) {
    this.config = data;
  }

  public loadFromEnv(): void {
    this.config = this.parseConfigFromEnv(process.env);
  }

  private parseConfigFromEnv(env: NodeJS.ProcessEnv): AuthConfig {
    return {
      prisma: {
        databaseUrl: env.DATABASE_URL || DEFAULT_AUTH_CONFIG.prisma.databaseUrl,
      },
    };
  }

  public get(): Readonly<AuthConfig> {
    return this.config;
  }
}
