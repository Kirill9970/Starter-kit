import { Controller, UseInterceptors } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  IConfirmRegistrationRequest,
  ICreateConfirmationCodesRequest,
  ICreateConfirmationCodesResponse,
  IFindOrCreateUserRequest,
  IFindOrCreateUserResponse,
  IGetMeRequest,
  IGetMeResponse,
  IGetUserByIdRequest,
  IGetUserByIdResponse,
  IGetUserByLoginRequest,
  INativeLoginRequest,
  INativeLoginResponse,
  RequireConfirmation,
  RequireConfirmationInterceptor,
  UserClientPatterns,
} from '@crypton-nestjs-kit/common';

import { UserService } from '../services/user.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @MessagePattern(UserClientPatterns.GET_ME)
  public async getMe(request: IGetMeRequest): Promise<IGetMeResponse> {
    return await this.userService.getMe(request);
  }

  @MessagePattern(UserClientPatterns.GET_CONFIRMATION_METHODS)
  public async getUserConfirmationMethods(request: any): Promise<any> {
    return await this.userService.getUserConfirmationMethods(request);
  }

  @MessagePattern(UserClientPatterns.GET_PERMISSIONS_LIST)
  public async getPermissionList(): Promise<any> {
    return await this.userService.getPermissionList();
  }

  @MessagePattern(UserClientPatterns.REGISTER_PERMISSIONS)
  public async registerPermissionsTestTest(@Payload() data: any): Promise<any> {
    return await this.userService.registerPermissions(data);
  }

  @MessagePattern(UserClientPatterns.UPDATE_2FA_PERMISSIONS)
  public async updateTwoFaPermissions(request: any): Promise<any> {
    return await this.userService.updateTwoFaPermissions(request);
  }

  @MessagePattern(UserClientPatterns.FIND_OR_CREATE_USER)
  public async findOrCreateUser(
    data: IFindOrCreateUserRequest,
  ): Promise<IFindOrCreateUserResponse> {
    return await this.userService.findOrCreateUser(data);
  }

  @MessagePattern(UserClientPatterns.CREATE_CONFIRMATION_CODES)
  public async createConfirmationCodes(
    data: ICreateConfirmationCodesRequest,
  ): Promise<ICreateConfirmationCodesResponse> {
    console.log(data);

    return await this.userService.createConfirmationCodes(
      data.userId,
      data.permissionId,
    );
  }

  @RequireConfirmation('d17ba476-d43e-49e7-a715-96b3c86c544c')
  @MessagePattern(UserClientPatterns.LOGIN_NATIVE)
  public async nativeLogin(
    data: INativeLoginRequest,
  ): Promise<INativeLoginResponse> {
    return await this.userService.nativeLogin(data);
  }

  @MessagePattern(UserClientPatterns.REGISTRATION_CONFIRM)
  public async registrationConfirm(
    data: IConfirmRegistrationRequest,
  ): Promise<any> {
    return await this.userService.registrationConfirm(data);
  }

  @MessagePattern(UserClientPatterns.GET_USER_BY_ID)
  public async getUserById(
    data: IGetUserByIdRequest,
  ): Promise<IGetUserByIdResponse> {
    return await this.userService.getUserById(data);
  }

  @MessagePattern(UserClientPatterns.GET_USER_BY_LOGIN)
  public async getUserByLogin(
    data: IGetUserByLoginRequest,
  ): Promise<IGetUserByIdResponse> {
    return await this.userService.getUserByLogin(data);
  }

  @MessagePattern(UserClientPatterns.GET_PERMISSIONS_BY_ROLE)
  public async getPermissionsByRole(roleId: string): Promise<any> {
    return await this.userService.getPermissionsByRole(roleId);
  }
}
