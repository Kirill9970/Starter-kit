import { DynamicModule, Global, Module } from '@nestjs/common';
import { SharedPrismaService } from './shared-prisma.service';
import { PRISMA_OPTIONS } from '../prisma.constants';
import { PrismaModuleOptions } from '../prisma.interfaces';

@Global()
@Module({})
export class SharedPrismaModule {
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
      module: SharedPrismaModule,
      imports: options.imports,
      providers: [SharedPrismaService, prismaOptionsProvider],
      exports: [SharedPrismaService],
    };
  }
}
