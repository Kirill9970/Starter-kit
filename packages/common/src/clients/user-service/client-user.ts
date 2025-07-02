import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy, RmqOptions, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

import { IRequest, IResponse, User } from '../../types';
import { createRmqMessage } from '../../utils';

export const USER_INJECT_TOKEN = 'USER_SERVICE';

export const loadUserClientOptions = (): RmqOptions => {
  const { env } = process;

  const BROKER_URL = env[`USER_SERVICE_RMQ_URL`] as string;
  const BROKER_QUEUE = env[`USER_SERVICE_RMQ_QUEUE`] as string;

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
export class UserClient {
  constructor(
    @Inject(USER_INJECT_TOKEN)
    private readonly userClientProxy: ClientProxy,
  ) {}

  /**
   * Returns information about the current user.
   * @param request - Request data for getting user info.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns User information response.
   */
  async getMe(
    request: IGetMeRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<IGetMeResponse> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_ME,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns available confirmation methods for the user.
   * @param request - Request data for confirmation methods.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns List of confirmation methods.
   */
  async getUserConfirmationMethods(
    request: any,
    traceId: string,
    serviceToken: string,
  ): Promise<any> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_CONFIRMATION_METHODS,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns user information by user ID.
   * @param request - Request data containing user ID.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns User information response.
   */
  async getUserById(
    request: IGetUserByIdRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<IGetUserByIdResponse> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_USER_BY_ID,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns user information by user ID.
   * @param request - Request data containing user ID.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns User information response.
   */
  async getUserByIdService(
    request: IGetUserByIdRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<IGetUserByIdResponse> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_USER_BY_ID_SERVICE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns user information by login.
   * @param request - Request data containing user login.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns User information response.
   */
  async getUserByLogin(
    request: IGetUserByLoginRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<IGetUserByIdResponse> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_USER_BY_LOGIN,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Returns user information by login.
   * @param request - Request data containing user login.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns User information response.
   */
  async getUserByLoginSecure(
    request: IGetUserByLoginRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<IGetUserByIdResponse> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_USERS_BY_LOGIN_SECURE,
        await createRmqMessage(traceId, serviceToken, request),
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
    serviceToken: string,
  ): Promise<any> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_PERMISSIONS_BY_ROLE,
        await createRmqMessage(traceId, serviceToken, request),
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
    serviceToken: string,
  ): Promise<{ status: boolean; permission: { id: string } }> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.GET_PERMISSIONS_BY_PATTERN,
        await createRmqMessage(traceId, serviceToken, pattern),
      ),
    );
  }

  /**
   * Finds or creates a user by login and password.
   * @param request - Request data for user creation or lookup.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns User creation or lookup result.
   */
  async findOrCreateUser(
    request: IFindOrCreateUserRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<IFindOrCreateUserResponse> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.FIND_OR_CREATE_USER,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Confirms user registration with a confirmation code.
   * @param request - Request data containing login and confirmation code.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Confirmation result.
   */
  async registrationConfirm(
    request: IConfirmRegistrationRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<any> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.REGISTRATION_CONFIRM,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Creates confirmation codes for 2FA.
   * @param request - Request data for confirmation code creation.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Confirmation codes creation result.
   */
  async createConfirmationCode(
    request: ICreateConfirmationCodesRequest,
    traceId: string,
    serviceToken: string,
  ): Promise<ICreateConfirmationCodesResponse> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.CREATE_CONFIRMATION_CODES,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Resets confirmation code for a user.
   * @param request - Request data for resetting confirmation code.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @returns Boolean indicating success.
   */
  async resetConfirmationCode(
    request: { login?: string; userId?: string; id?: string },
    traceId: string,
    serviceToken: string,
  ): Promise<boolean> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.RESET_CONFIRMATION_CODE,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }

  /**
   * Updates two-factor authentication permissions for a user.
   * @param traceId - Trace identifier for request tracing in the system.
   * @param serviceToken - Token for zero-trust authorization between services.
   * @param request - Request data for updating 2FA permissions.
   * @returns Update result.
   */
  async updateTwoFaPermissions(
    traceId: string,
    serviceToken: string,
    request: any,
  ): Promise<any> {
    return await firstValueFrom(
      this.userClientProxy.send(
        UserClientPatterns.UPDATE_2FA_PERMISSIONS,
        await createRmqMessage(traceId, serviceToken, request),
      ),
    );
  }
}

export enum UserClientPatterns {
  GET_ME = 'get:me',
  RESET_CONFIRMATION_CODE = 'confirmation:code:reset',
  UPDATE_2FA_PERMISSIONS = '2fa:permissions:update',
  GET_CONFIRMATION_METHODS = 'confirmation:methods:list',
  GET_USER_BY_ID = 'user:get:by_id',
  GET_USER_BY_ID_SERVICE = 'user:get:by_service',
  GET_USER_BY_LOGIN = 'user:get:by_login',
  GET_USERS_BY_LOGIN_SECURE = 'users:get:by_login:secure',
  GET_PERMISSIONS_BY_ROLE = 'permissions:get:by_role',
  GET_PERMISSIONS_BY_PATTERN = 'permissions:get:by_pattern',
  FIND_OR_CREATE_USER = 'user:find_or_create',
  REGISTRATION_CONFIRM = 'registration:confirm',
  CREATE_CONFIRMATION_CODES = 'confirmation_codes:create',
}

// --- User ---
export interface IUser extends Partial<User> {
  login: string;
}

export interface IGetMeRequest extends IRequest {
  readonly userId: string;
}

export interface IGetMeResponse extends IResponse {
  readonly user: {
    readonly id: string;
    readonly fullName: string;
    readonly username: string;
    readonly referralCode: number;
    readonly type: string;
    readonly extraData: any;
    readonly createdAt: Date;
    readonly updatedAt: Date;
  };
}

export interface IGetUserByIdRequest extends IRequest {
  readonly userId: string;
}

export interface IGetUserByLoginRequest extends IRequest {
  readonly login: string;
}

export interface IGetUserByIdResponse extends IResponse {
  readonly user: Partial<User>;
}

export interface IFindOrCreateUserRequest extends IRequest {
  login: string;
  password: string;
  loginType: string;
  referralCode?: number;
}

export interface IConfirmRegistrationRequest extends IRequest {
  login: string;
  code: number;
}

export interface ICreateConfirmationCodesRequest extends IRequest {
  userId: string;
  permissionId: string;
}

export interface ICreateConfirmationCodesResponse extends IResponse {
  readonly confirmationMethods: string[];
}

export interface INativeLoginRequest extends IRequest {
  login: string;
  password: string;
  userAgent: string;
  userIp: string;
  fingerprint: string;
  twoFaCodes?: ITwoFaCodes;
  country?: string;
  city?: string;
}

export interface ITwoFaCodes {
  emailCode: number;
  phoneCode: number;
  googleCode: number;
}

export interface ITokens {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export interface INativeLoginResponse extends IResponse {
  readonly user: IUser;
  readonly tokens: ITokens;
}

export interface IFindOrCreateUserResponse extends IResponse {
  readonly user: IUser;
  readonly created?: boolean;
}

// --- ADMIN ---

export interface INotifyUsersRequest extends IRequest {
  ref_code?: number;
  dateTo: string;
  dateFrom: string;
  message: { en: string; ru: string };
  url: string;
  limit?: number;
  page?: number;
}

export type INotifyUsersResponse = IResponse;

export interface INotifyInactiveUsersRequest extends IRequest {
  id: string;
  dateFrom: string;
  dateTo: string;
  message: { en: string; ru: string };
  url: string;
}

export type INotifyInactiveUsersResponse = IResponse;
