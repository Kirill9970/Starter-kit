import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqOptions, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { createRmqMessage } from '../../utils';

export const PERMISSION_INJECT_TOKEN = 'PERMISSION_SERVICE';

export const loadPermissionClientOptions = (): RmqOptions => {
  const { env } = process;

  const BROKER_URL = env[`PERMISSION_SERVICE_RMQ_URL`] as string;
  const BROKER_QUEUE = env[`PERMISSION_SERVICE_RMQ_QUEUE`] as string;

  return {
    transport: Transport.RMQ,
    options: {
      urls: [BROKER_URL],
      queue: BROKER_QUEUE,
      queueOptions: {
        durable: false,
      },
    },
  };
};

@Injectable()
export class PermissionClient {
  constructor(
    @Inject(PERMISSION_INJECT_TOKEN)
    private readonly permissionClientProxy: ClientProxy,
  ) {}

  /**
   * Registers a set of permissions in the permission service.
   * @param request - Permissions registration data.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Registration result.
   */
  async registerPermissions(request: any, traceId: string): Promise<any> {
    return await firstValueFrom(
      this.permissionClientProxy.send(
        PermisssionClientPatterns.REGISTER_PERMISSIONS,
        await createRmqMessage(traceId, 'service', request),
      ),
    );
  }

  /**
   * Returns the list of all permissions.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns List of permissions.
   */
  async getPermissionList(traceId: string): Promise<any> {
    return await firstValueFrom(
      this.permissionClientProxy.send(
        PermisssionClientPatterns.GET_PERMISSIONS_LIST,
        await createRmqMessage(traceId, 'service'),
      ),
    );
  }

  /**
   * Returns permissions for a given role.
   * @param request - Request data containing role ID and optional type.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns List of permissions for the role.
   */
  async getPermissionsByRole(
    request: { roleId: string; type?: string },
    traceId: string,
  ): Promise<any> {
    return await firstValueFrom(
      this.permissionClientProxy.send(
        PermisssionClientPatterns.GET_PERMISSIONS_BY_ROLE,
        await createRmqMessage(traceId, 'service', request),
      ),
    );
  }

  /**
   * Returns permission by pattern.
   * @param pattern - Permission pattern string.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Permission object with status and id.
   */
  async getPermissionsByPattern(
    pattern: string,
    traceId: string,
  ): Promise<{ status: boolean; permission: { id: string } }> {
    return await firstValueFrom(
      this.permissionClientProxy.send(
        PermisssionClientPatterns.GET_PERMISSIONS_BY_PATTERN,
        await createRmqMessage(traceId, 'service', pattern),
      ),
    );
  }

  /**
   * Updates two-factor authentication permissions for a user.
   * @param request - Request data for updating 2FA permissions.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Update result.
   */
  async updateTwoFaPermissions(request: any, traceId: string): Promise<any> {
    return await firstValueFrom(
      this.permissionClientProxy.send(
        PermisssionClientPatterns.UPDATE_2FA_PERMISSIONS,
        await createRmqMessage(traceId, 'service', request),
      ),
    );
  }
}

export enum PermisssionClientPatterns {
  REGISTER_PERMISSIONS = 'permissions:register:service',
  UPDATE_2FA_PERMISSIONS = 'permissions:update:service',
  GET_PERMISSIONS_LIST = 'permissions:list:service',
  GET_PERMISSIONS_BY_ROLE = 'permissions:by:role:service',
  GET_PERMISSIONS_BY_PATTERN = 'permissions:by:pattern:service',
}
