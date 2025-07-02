import { Injectable } from '@nestjs/common';
import { Transport } from '@nestjs/microservices';

import { DEFAULT_CONFIG } from './config.default';
import { ConfigData, ConfigDatabase, ConfigSwagger } from './config.interface';

@Injectable()
export class ConfigService {
  private config: ConfigData;

  constructor(data: ConfigData = DEFAULT_CONFIG) {
    this.config = data;
  }

  public loadFromEnv(): void {
    this.config = this.parseConfigFromEnv(process.env);
  }

  // eslint-disable-next-line max-lines-per-function
  private parseConfigFromEnv(env: NodeJS.ProcessEnv): ConfigData {
    return {
      env: env.NODE_ENV || DEFAULT_CONFIG.env,
      under_maintenance:
        env.UNDER_MAINTENANCE || DEFAULT_CONFIG.under_maintenance,
      host: env.HOST || DEFAULT_CONFIG.host,
      clientUrl: env.CLIENT_URL || '',
      port: parseInt(env.PORT!, 10),
      secretKey: env.SECRET_API_KEY! || DEFAULT_CONFIG.secretKey,
      secretKeys: {
        GOOGLE_OAUTH_API_KEY:
          env.GOOGLE_OAUTH_API_KEY! ||
          DEFAULT_CONFIG.secretKeys.GOOGLE_OAUTH_API_KEY,
        INTEGRATION_API_KEY:
          env.INTEGRATION_API_KEY! ||
          DEFAULT_CONFIG.secretKeys.INTEGRATION_API_KEY,
      },
      db: this.parseDBConfig(env),
      swagger: this.parseSwaggerConfig(env, DEFAULT_CONFIG.swagger),
      logLevel: env.LOG_LEVEL! || DEFAULT_CONFIG.logLevel,
      auth: {
        access_token_expires_in: parseInt(
          env.AUTH_ACCESS_TOKEN_EXPIRES_IN || '3600',
          10,
        ),
        refresh_token_expires_in: parseInt(
          env.AUTH_REFRESH_TOKEN_EXPIRES_IN || '604800',
          10,
        ),
        token_secret: env.AUTH_TOKEN_SECRET || 'default-secret-key',
        service_secrets: {
          user_service: env.USER_SERVICE_JWT_SECRET || 'user-service-secret',
          default: env.AUTH_TOKEN_SECRET || 'default-secret-key',
        },
        session_cache_ttl: parseInt(
          env.AUTH_SESSION_CACHE_TTL || '3600000',
          10,
        ),
        max_sessions_per_user: parseInt(
          env.AUTH_MAX_SESSIONS_PER_USER || '5',
          10,
        ),
        rate_limit: {
          ttl: parseInt(env.AUTH_RATE_LIMIT_TTL || '60000', 10),
          limit: parseInt(env.AUTH_RATE_LIMIT_MAX || '100', 10),
        },
      },
      redisCache: {
        url: env.REDIS_URL || 'redis://localhost:6379',
      },
      batchService: {
        db: {
          host: env.BATCH_DB_HOST || 'localhost',
          port: Number(env.BATCH_DB_PORT) || 5432,
          username: env.BATCH_DB_USERNAME || 'postgres',
          password: env.BATCH_DB_PASSWORD || 'postgres',
          database: env.BATCH_DB_NAME || 'postgres',
          ssl:
            env.BATCH_DB_SSL == 'true' ? { rejectUnauthorized: false } : false,
        },
        amqp: {
          options: {
            urls: [env.BATCH_SERVICE_RMQ_URL || ''],
            queue: env.BATCH_SERVICE_RMQ_QUEUE || '',
            queueOptions: {
              durable: false,
            },
          },
          transport: Transport.RMQ,
        },
      },
      authService: {
        options: {
          urls: [env.AUTH_SERVICE_RMQ_URL || ''],
          queue: env.AUTH_SERVICE_RMQ_QUEUE || '',
          queueOptions: {
            durable: false,
          },
        },
        transport: Transport.RMQ,
      },
      coordinatorService: {
        options: {
          urls: [env.COORDINATOR_SERVICE_RMQ_URL || ''],
          queue: env.COORDINATOR_SERVICE_RMQ_QUEUE || '',
          queueOptions: {
            durable: false,
          },
        },
        transport: Transport.RMQ,
      },
      userService: {
        options: {
          urls: [env.USER_SERVICE_RMQ_URL || ''],
          queue: env.USER_SERVICE_RMQ_QUEUE || '',
          queueOptions: {
            durable: false,
          },
        },
        transport: Transport.RMQ,
      },
      permissionService: {
        options: {
          urls: [env.PERMISSION_SERVICE_RMQ_URL || ''],
          queue: env.PERMISSION_SERVICE_RMQ_QUEUE || '',
          queueOptions: {
            durable: false,
          },
        },
        transport: Transport.RMQ,
      },
      oauth: {
        frontendUrl: env.FRONTEND_URL || '',
        google: {
          clientId: env.GOOGLE_CLIENT_ID || '',
          clientSecret: env.GOOGLE_CLIENT_SECRET || '',
          callbackUrl: env.GOOGLE_CALLBACK_URL || '',
          redirectUrl:
            env.GOOGLE_REDIRECT_URL ||
            `https://accounts.google.com/o/oauth2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${env.GOOGLE_CLIENT_SECRET}&response_type=code&scope=email%20profile`,
        },
        twitter: {
          clientId: env.TWITTER_CLIENT_ID || '',
          clientSecret: env.TWITTER_CLIENT_SECRET || '',
          callbackUrl: env.TWITTER_CALLBACK_URL || '',
          redirectUrl: env.TWITTER_REDIRECT_URL || '',
        },
        apple: {
          clientId: env.APPLE_CLIENT_ID || '',
          teamId: env.APPLE_TEAM_ID || '',
          keyId: env.APPLE_KEY_ID || '',
          callbackUrl: env.APPLE_CALLBACK_URL || '',
          redirectUrl: env.TWITTER_REDIRECT_URL || '',
        },
      },
      notifyQueue: {
        url: 'redis://localhost:6379',
      },

      notifyUserQueue: {
        url: 'redis://localhost:6379',
      },
      throttler: {
        ttl: Number(env.THROTTLE_TTL) || 1000,
        limit: Number(env.THROTTLE_LIMIT) || 30,
      },
      captcha: {
        secretKey: process.env.CAPTCHA_SECRET_KEY || '',
        siteKey: process.env.CAPTCHA_SITE_KEY || '',
        enabled: process.env.CAPTCHA_ENABLED === 'true',
      },
    };
  }

  private parseDBConfig(env: NodeJS.ProcessEnv): ConfigDatabase {
    const db_config: ConfigDatabase = {};

    db_config['host'] = env.DB_HOST || 'localhost';
    db_config['port'] = Number(env.DB_PORT) || 5432;
    db_config['username'] = env.DB_USERNAME || 'postgres';
    db_config['password'] = env.DB_PASSWORD || 'postgres';
    db_config['database'] = env.DB_NAME || 'postgres';
    db_config['ssl'] =
      env[`DB_SSL`] == 'true' ? { rejectUnauthorized: false } : false;

    db_config['replication'] = env.DB_REPLICATION === 'true';

    db_config['migrationsRun'] = env.RUN_MIGRATIONS === 'true';

    if (env.DB_REPLICATION == 'true') {
      const slaves: object[] = [];

      for (let i = 1; i <= Number(env.DB_REPLICATION_COUNT); i++) {
        slaves.push({
          host: env[`DB_HOST_R_${i}`] || 'localhost',
          port: Number(env[`DB_PORT_R_${i}`]) || 5432,
          username: env[`DB_USERNAME_R_${i}`] || 'postgres',
          password: env[`DB_PASSWORD_R_${i}`] || 'postgres',
          database: env[`DB_NAME_R_${i}`] || 'postgres',
          ssl: env[`DB_SSL`] == 'true' ? { rejectUnauthorized: false } : false,
        });
      }
      db_config.slaves = slaves;
    }

    return db_config;
  }

  private parseSwaggerConfig(
    env: NodeJS.ProcessEnv,
    defaultConfig: Readonly<ConfigSwagger>,
  ): { username: string; password: string } {
    return {
      username: env.SWAGGER_USERNAME || defaultConfig.username,
      password: env.SWAGGER_PASSWORD || defaultConfig.password,
    };
  }

  public get(): Readonly<ConfigData> {
    return this.config;
  }
}
