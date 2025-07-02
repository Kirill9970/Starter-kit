import { RmqOptions } from '@nestjs/microservices/interfaces/microservice-configuration.interface';

export interface ConfigDatabase {
  url?: string;
  host?: string;
  port?: number;
  username?: string;
  password?: string;
  database?: string;
  replication?: boolean;
  slaves?: object[];
  slavesCount?: number;
  migrationsRun?: boolean;
  ssl?: object | boolean;
}

export interface ConfigSwagger {
  username: string;
  password: string;
}

export interface AuthConfig {
  access_token_expires_in: number;
  refresh_token_expires_in: number;
  token_secret: string;
  service_secrets: {
    user_service: string;
    default: string;
  };
  session_cache_ttl: number;
  max_sessions_per_user: number;
  rate_limit: {
    ttl: number;
    limit: number;
  };
}

export interface RedisConfig {
  url: string;
}

export interface ApiKeys {
  GOOGLE_OAUTH_API_KEY: string;
  INTEGRATION_API_KEY: string;
}

export interface OAuthConfig {
  frontendUrl: string;
  google: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    redirectUrl: string;
  };
  twitter: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    redirectUrl: string;
  };
  apple: {
    clientId: string;
    teamId: string;
    keyId: string;
    callbackUrl: string;
    redirectUrl: string;
  };
}

export interface ThrottlerConfig {
  ttl: number;
  limit: number;
}

export interface ConfigData {
  env: string;

  port: number;

  host: string;

  clientUrl: string;

  secretKey: string;

  db: ConfigDatabase;

  swagger: ConfigSwagger;

  logLevel: string;

  under_maintenance: string;

  auth: AuthConfig;

  secretKeys: ApiKeys;

  redisCache?: RedisConfig;

  authService?: RmqOptions;

  coordinatorService?: RmqOptions;

  batchService?: {
    db: ConfigDatabase;
    amqp: RmqOptions;
  };

  userService?: RmqOptions;

  permissionService?: RmqOptions;

  oauth: OAuthConfig;

  notifyQueue: RedisConfig;

  notifyUserQueue: RedisConfig;

  taskScheduler?: RmqOptions;

  throttler: ThrottlerConfig;

  captcha: {
    secretKey: string;
    siteKey: string;
    enabled: boolean;
  };
}
