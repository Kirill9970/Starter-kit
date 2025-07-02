import {
  forwardRef,
  Inject,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { DiscoveryService, MetadataScanner } from '@nestjs/core';
import { PATTERN_METADATA } from '@nestjs/microservices/constants';

import { PermissionClient } from '../clients';

import { CONTROLLER_META, ControllerType } from './controller-meta.decorator';

@Injectable()
export class PermissionsRegistrar implements OnModuleInit {
  private readonly logger = new Logger(PermissionsRegistrar.name);

  constructor(
    @Inject(DiscoveryService)
    private readonly discoveryService: DiscoveryService,
    @Inject(MetadataScanner)
    private readonly metadataScanner: MetadataScanner,
    @Inject(forwardRef(() => PermissionClient))
    private readonly permissionClient: PermissionClient,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      const { permissions } = await this.permissionClient.getPermissionList(
        'service',
      );

      const permissionsList = this.extractPermissionsFromControllers();

      const updatedPermissions = this.filterUpdatedPermissions(
        permissionsList,
        permissions,
      );

      if (updatedPermissions.length > 0) {
        await this.permissionClient.registerPermissions(
          { permissions: updatedPermissions },
          'service',
        );
      }

      this.logger.log(
        `Permissions registered: ${permissionsList.length} | updated: ${updatedPermissions.length}`,
      );
    } catch (e) {
      this.logger.error('Failed to register permissions', e);
    }
  }

  private extractPermissionsFromControllers(): Array<{
    method: string;
    alias: string;
    messagePattern: string;
    description: string;
    isPublic: boolean;
    type: string;
  }> {
    const controllers = this.discoveryService.getControllers();
    const permissionsList: Array<{
      method: string;
      alias: string;
      messagePattern: string;
      description: string;
      isPublic: boolean;
      type: string;
    }> = [];

    for (const controller of controllers) {
      const instance = controller.instance;
      const prototype = Object.getPrototypeOf(instance);

      this.metadataScanner
        .getAllMethodNames(prototype)
        .forEach((methodName) => {
          const method = prototype[methodName];
          const permissionMeta = Reflect.getMetadata(CONTROLLER_META, method);
          const messagePattern = Reflect.getMetadata(PATTERN_METADATA, method);

          if (messagePattern) {
            permissionsList.push({
              method: method.name,
              alias: permissionMeta?.name || null,
              messagePattern: messagePattern[0],
              description: permissionMeta?.description || null,
              isPublic: !!permissionMeta?.isPublic,
              type: permissionMeta?.type || ControllerType.READ,
            });
          }
        });
    }

    return permissionsList;
  }

  private filterUpdatedPermissions(
    permissionsList: Array<{
      method: string;
      alias: string;
      messagePattern: string;
      description: string;
      isPublic: boolean;
      type: string;
    }>,
    existingPermissions: Array<{
      method: string;
      alias: string;
      messagePattern: string;
      description: string;
      isPublic: boolean;
      type: string;
    }>,
  ): Array<{
    method: string;
    alias: string;
    messagePattern: string;
    description: string;
    isPublic: boolean;
    type: string;
  }> {
    // Оптимизация: строим Map для быстрого поиска по messagePattern
    const existingMap = new Map<string, (typeof existingPermissions)[0]>();

    for (const p of existingPermissions) {
      existingMap.set(p.messagePattern, p);
    }

    return permissionsList.filter((permission) => {
      const existingPermission = existingMap.get(permission.messagePattern);

      return (
        !existingPermission ||
        existingPermission.method !== permission.method ||
        existingPermission.alias !== permission.alias ||
        existingPermission.messagePattern !== permission.messagePattern ||
        existingPermission.description !== permission.description ||
        existingPermission.isPublic !== permission.isPublic ||
        existingPermission.type !== permission.type
      );
    });
  }

  // private getMethodDescription(prototype: any, methodName: string): string {
  //   // Пример: если используете swagger decorators
  //   const descriptor = Object.getOwnPropertyDescriptor(prototype, methodName);
  //   const originalMethod = descriptor?.value || prototype[methodName];
  //   const metadata = Reflect.getMetadata(
  //     'swagger/apiOperation',
  //     originalMethod,
  //   );
  //
  //   return metadata?.description || '';
  // }
}
