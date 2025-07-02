import { forwardRef, Module } from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';

import { ClientPermissionModule } from '../clients';

import { PermissionsRegistrar } from './permissions-registrar.service';

@Module({
  imports: [forwardRef(() => ClientPermissionModule)],
  providers: [DiscoveryService, MetadataScanner, PermissionsRegistrar],
  exports: [PermissionsRegistrar],
})
export class PermissionsRegistrarModule {}
