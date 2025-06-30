import {
  Inject,
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { PrismaClient } from '../generated/client';
import { PRISMA_OPTIONS } from './prisma.constants';
import { PrismaModuleOptions } from './prisma.interfaces';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Inject(PRISMA_OPTIONS) options: PrismaModuleOptions) {
    super({
      datasources: {
        db: {
          url: options.databaseUrl,
        },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
