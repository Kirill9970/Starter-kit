import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  FunctionType,
  PermisssionClientPatterns,
} from '@crypton-nestjs-kit/common';

import { PermissionService } from '../services/permission.service';

@Controller('user')
export class PermissionController {
  constructor(private readonly userService: PermissionService) {}

  @FunctionType('READ')
  @MessagePattern(PermisssionClientPatterns.GET_PERMISSIONS_LIST)
  public async getPermissionList(): Promise<any> {
    return await this.userService.getPermissionList();
  }

  @MessagePattern(PermisssionClientPatterns.REGISTER_PERMISSIONS)
  public async registerPermissions(@Payload() data: any): Promise<any> {
    return await this.userService.registerPermissions(data);
  }

  @FunctionType('READ')
  @MessagePattern(PermisssionClientPatterns.GET_PERMISSIONS_BY_ROLE)
  public async getPermissionsByRole(request: {
    roleId: string;
    type?: string;
  }): Promise<any> {
    return await this.userService.getPermissionsByRole(request);
  }

  @MessagePattern(PermisssionClientPatterns.GET_PERMISSIONS_BY_PATTERN)
  public async getPermissionsByPattern(pattern: string): Promise<any> {
    return await this.userService.getPermissionsByPattern(pattern);
  }
}
