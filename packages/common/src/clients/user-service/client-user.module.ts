import { DynamicModule } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import {
  ClientOptions,
  ClientProxyFactory,
  CustomClientOptions,
} from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@crypton-nestjs-kit/config';

import { USER_INJECT_TOKEN, UserClient } from './client-user';

class UserModule {}

export class ClientUserModule {
  static forRoot(options: ClientOptions | CustomClientOptions): DynamicModule {
    return {
      global: true,
      imports: [
        JwtModule.registerAsync({
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            return {
              secret: configService.get().auth.service_secrets.user_service,
            };
          },
          inject: [ConfigService],
        }),
      ],
      module: UserModule,
      providers: [
        UserClient,
        {
          provide: USER_INJECT_TOKEN,
          useFactory: () => ClientProxyFactory.create(options),
        },
      ],
      exports: [UserClient],
    };
  }
}
