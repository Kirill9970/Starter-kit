// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { RmqOptions } from '@nestjs/microservices';
import { ConfigService } from '@crypton-nestjs-kit/config';

import { PermissionModule } from './permission.module';

async function bootstrap(): Promise<void> {
  const configService = new ConfigService();

  configService.loadFromEnv();
  const userConfig = configService.get().permissionService as RmqOptions;
  const app = await NestFactory.createMicroservice(
    PermissionModule,
    userConfig,
  );

  await app.listen();
}

bootstrap();
