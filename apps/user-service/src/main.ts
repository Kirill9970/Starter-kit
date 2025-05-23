// eslint-disable-next-line @typescript-eslint/no-var-requires
require('dotenv').config();

import { NestFactory } from '@nestjs/core';
import { RmqOptions } from '@nestjs/microservices';
import { ConfigService } from '@crypton-nestjs-kit/config';

import { UserModule } from './user.module';

async function bootstrap(): Promise<void> {
  const configService = new ConfigService();

  configService.loadFromEnv();
  const userConfig = configService.get().userService as RmqOptions;
  const app = await NestFactory.createMicroservice(UserModule, userConfig);

  await app.listen();
}

bootstrap();
