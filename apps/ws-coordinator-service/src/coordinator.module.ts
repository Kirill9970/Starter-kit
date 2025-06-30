import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@crypton-nestjs-kit/config';
import { ServiceEntity } from '@crypton-nestjs-kit/common';
import { DBModule } from '@crypton-nestjs-kit/database';

import { CoordinatorController } from './controller/coordinator.controller';
import { CoordinatorService } from './services/coordinator.service';
import { CoordinatorWorker } from './services/coordinator.worker';

@Module({
  imports: [
    ConfigModule,
    DBModule.forRoot({ entities: [ServiceEntity] }),
    // TODO: temp solution, required to use more clear solution
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const db = configService.get().db;
        return {
          type: 'postgres',
          host: db.host,
          port: db.port,
          username: db.username,
          password: db.password,
          database: db.database,
          synchronize: true,
          logging: false,
          entities: [ServiceEntity],
        };
      },
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([ServiceEntity]),
  ],
  controllers: [CoordinatorController],
  providers: [CoordinatorService, CoordinatorWorker],
})
export class CoordinatorModule {}
