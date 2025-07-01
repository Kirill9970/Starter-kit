import { DynamicModule, Global, Module } from '@nestjs/common';
import { WsCoordinatorPrismaService } from './ws-coordinator-prisma.service';
import { PRISMA_OPTIONS } from '../prisma.constants';
import { PrismaModuleOptions } from '../prisma.interfaces';

@Global()
@Module({})
export class WsCoordinatorPrismaModule {
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
      module: WsCoordinatorPrismaModule,
      imports: options.imports,
      providers: [WsCoordinatorPrismaService, prismaOptionsProvider],
      exports: [WsCoordinatorPrismaService],
    };
  }
}
