import { DynamicModule, Global, Module } from '@nestjs/common';
import { BatchPrismaService } from './batch-prisma.service';
import { PRISMA_OPTIONS } from '../prisma.constants';
import { PrismaModuleOptions } from '../prisma.interfaces';

@Global()
@Module({})
export class BatchPrismaModule {
  static forRootAsync(options: {
    imports: any[];
    inject: any[];
    useFactory: (...args: any[]) => PrismaModuleOptions;
  }): DynamicModule {
    const prismaOptionsProvider = {
      provide: PRISMA_OPTIONS,
      useFactory: options.useFactory,
      inject: options.inject,
    };

    return {
      module: BatchPrismaModule,
      imports: options.imports,
      providers: [BatchPrismaService, prismaOptionsProvider],
      exports: [BatchPrismaService],
    };
  }
}
