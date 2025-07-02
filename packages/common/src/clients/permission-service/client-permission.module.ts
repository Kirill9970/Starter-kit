import { DynamicModule } from '@nestjs/common';
import {
  ClientOptions,
  ClientProxyFactory,
  CustomClientOptions,
} from '@nestjs/microservices';

import { PERMISSION_INJECT_TOKEN, PermissionClient } from './client-permission';

class PermissionModule {}

export class ClientPermissionModule {
  static forRoot(options: ClientOptions | CustomClientOptions): DynamicModule {
    return {
      global: true,
      module: PermissionModule,
      providers: [
        PermissionClient,
        {
          provide: PERMISSION_INJECT_TOKEN,
          useFactory: () => ClientProxyFactory.create(options),
        },
      ],
      exports: [PermissionClient],
    };
  }
}
