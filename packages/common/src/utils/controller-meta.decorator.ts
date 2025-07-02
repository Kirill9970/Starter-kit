import { SetMetadata } from '@nestjs/common';

export const CONTROLLER_META = 'controllerMeta';

export interface ControllerMetaOptions {
  name: string;
  description?: string;
  isPublic?: boolean;
  type?: ControllerType;
  needsPermission?: boolean;
  needsConfirmation?: boolean;
}

export enum ControllerType {
  READ = 'read',
  WRITE = 'write',
  SERVICE = 'service',
}

export function ControllerMeta(options: ControllerMetaOptions) {
  return SetMetadata(CONTROLLER_META, options);
}
