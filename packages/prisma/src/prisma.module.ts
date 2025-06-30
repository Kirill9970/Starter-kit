import { DynamicModule, Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { PRISMA_OPTIONS } from './prisma.constants';
import { PrismaModuleOptions } from './prisma.interfaces';

@Global()
@Module({})
export class PrismaModule {
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
      module: PrismaModule,
      imports: options.imports,
      providers: [PrismaService, prismaOptionsProvider],
      exports: [PrismaService],
    };
  }
}
