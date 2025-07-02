import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { BatchPrismaService } from '@crypton-nestjs-kit/prisma';

import { DEFAULT_SETTINGS } from './settings.default';
import { Settings } from './settings.interface';

@Injectable()
export class SettingService implements OnModuleInit {
  private readonly PULL_SETTINGS_INTERVAL = 5 * 60 * 1000;
  settings = DEFAULT_SETTINGS;

  constructor(
    @Inject(BatchPrismaService) private readonly prisma: BatchPrismaService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.pull();

    setInterval(() => this.pull(), this.PULL_SETTINGS_INTERVAL);
  }

  private async pull(): Promise<void> {
    const databaseSettings = await this.prisma.settings.findMany();

    databaseSettings.forEach((setting: { key: string; data: any }) => {
      this.settings[setting.key as Settings] = setting.data;
    });
  }
}
