import { Transport } from '@nestjs/microservices';

import { ConfigData } from './config.interface';

export const DEFAULT_CONFIG: ConfigData = {
  port: Number(process.env.PORT || 3001),
  host: process.env.HOST || 'localhost',
  clientUrl: '',
  under_maintenance: 'false',
  env: 'production',
  secretKey: 'secret',
  secretKeys: {
    GOOGLE_OAUTH_API_KEY: 'google-secret-api-key',
    INTEGRATION_API_KEY: 'integration-secret-api-key',
  },
  db: {
    url: '',
  },
  auth: {
    access_token_expires_in: 15 * 60 * 1000,
    refresh_token_expires_in: 60 * 60 * 1000,
    token_secret: 'secret',
    service_secrets: {
      user_service: 'user-service-secret',
      default: 'default-service-secret',
    },
    session_cache_ttl: 6 * 60 * 60 * 1000,
    max_sessions_per_user: 5,
    rate_limit: {
      ttl: 60 * 1000,
      limit: 100,
    },
  },
  swagger: {
    username: '',
    password: '',
  },
  logLevel: 'info',

  authService: {
    options: {
      urls: [''],
      queue: '',
      queueOptions: {
        durable: false,
      },
    },
    transport: Transport.RMQ,
  },
  coordinatorService: {
    options: {
      urls: [''],
      queue: '',
      queueOptions: {
        durable: false,
      },
    },
    transport: Transport.RMQ,
  },
  oauth: {
    frontendUrl: '',
    google: {
      clientId: '',
      clientSecret: '',
      callbackUrl: '',
      redirectUrl: '',
    },
    twitter: {
      clientId: '',
      clientSecret: '',
      callbackUrl: '',
      redirectUrl: '',
    },
    apple: {
      clientId: '',
      teamId: '',
      keyId: '',
      callbackUrl: '',
      redirectUrl: '',
    },
  },
  notifyQueue: {
    url: 'redis://localhost:6379',
  },
  notifyUserQueue: {
    url: 'redis://localhost:6379',
  },
  batchService: {
    db: {},
    amqp: {
      options: {
        urls: [''],
        queue: '',
        queueOptions: {
          durable: false,
        },
      },
      transport: Transport.RMQ,
    },
  },
  permissionService: {
    options: {
      urls: [''],
      queue: '',
      queueOptions: {
        durable: false,
      },
    },
    transport: Transport.RMQ,
  },
  throttler: {
    ttl: 6000,
    limit: 3,
  },
  captcha: {
    secretKey: '',
    siteKey: '',
    enabled: false,
  },
};
