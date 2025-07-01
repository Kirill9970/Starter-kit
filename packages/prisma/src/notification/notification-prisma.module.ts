// import { DynamicModule, Global, Module } from '@nestjs/common';
// import { NotificationPrismaService } from './prisma.service';
// import { PRISMA_OPTIONS } from '../prisma.constants';
// import { PrismaModuleOptions } from '../prisma.interfaces';

// @Global()
// @Module({})
// export class NotificationPrismaModule {
//   static forRootAsync(options: {
//     imports: any[];
//     inject: any[];
//     useFactory: (...args: any[]) => PrismaModuleOptions;
//   }): DynamicModule {
//     const prismaOptionsProvider = {
//       provide: PRISMA_OPTIONS,
//       useFactory: options.useFactory,
//       inject: options.inject,
//     };

//     return {
//       module: NotificationPrismaModule,
//       imports: options.imports,
//       providers: [NotificationPrismaService, prismaOptionsProvider],
//       exports: [NotificationPrismaService],
//     };
//   }
// }
