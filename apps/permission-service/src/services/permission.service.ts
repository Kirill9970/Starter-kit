import { Cache } from '@nestjs/cache-manager';
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  ApiKeyType,
  AuthClient,
  comparePassword,
  decrypt,
  DefaultRole,
  hashPassword,
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
  ISessionCreateRequest,
  LoginMethod,
  TwoFactorPermissionsEntity,
  UserEntity,
  UserLoginMethodsEntity,
  UserStatus,
} from '@crypton-nestjs-kit/common';
import { PermissionEntity } from '@crypton-nestjs-kit/common/build/entities/user/permissions.entity';
import { RoleEntity } from '@crypton-nestjs-kit/common/build/entities/user/role.entity';
import { UserRoleEntity } from '@crypton-nestjs-kit/common/build/entities/user/user-role.entity';
import { In, Repository } from 'typeorm';
import { v4 } from 'uuid';
import { uuid } from 'uuidv4';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const randomstring = require('randomstring');

@Injectable()
export class PermissionService implements OnModuleInit {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepo: Repository<UserEntity>,
    @InjectRepository(UserLoginMethodsEntity)
    private readonly userLoginMethods: Repository<UserLoginMethodsEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepo: Repository<RoleEntity>,
    @InjectRepository(UserRoleEntity)
    private readonly userRoleRepo: Repository<UserRoleEntity>,
    @InjectRepository(PermissionEntity)
    private readonly permissionRepo: Repository<PermissionEntity>,
    @InjectRepository(TwoFactorPermissionsEntity)
    private readonly twoFactorPermissionsRepo: Repository<TwoFactorPermissionsEntity>,
    private readonly cacheManager: Cache,
  ) {}

  async onModuleInit(): Promise<void> {
    const defaultRoles = await this.findDefaultRole();

    if (defaultRoles.length < 1) {
      await this.createDefaultRole();
    }
  }

  public async registerPermissions(request: any): Promise<any> {
    try {
      await this.permissionRepo.upsert(request.permissions, [
        'messagePattern',
        'method',
      ]);

      await this.updateDefaultRolePermissions(request.permissions);

      return {
        status: true,
        message: 'Permissions added',
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Permissions adding failed',
        user: null,
      };
    }
  }

  public async getPermissionList(): Promise<any> {
    try {
      const permissions = await this.permissionRepo.find();

      if (permissions.length === 0) {
        return {
          status: false,
          message: 'Permissions not found',
          permissions: [],
        };
      }

      return {
        status: true,
        message: 'Permissions added',
        permissions,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Permissions not found',
        permissions: [],
      };
    }
  }

  private async updateDefaultRolePermissions(
    permissions: PermissionEntity[],
  ): Promise<boolean> {
    const default_roles = await this.roleRepo.find({
      where: { name: In(Object.keys(DefaultRole)) },
      relations: ['permissions'],
    });

    const isUpdated = await Promise.all(
      default_roles.map(async (role) => {
        if (role.name == 'USER') {
        }

        const newPermissions = permissions.filter(
          (permission) =>
            !role.permissions.some((p) => p.method === permission.method),
        );

        if (newPermissions.length === 0) {
          return false;
        }

        await this.cacheManager.del(`rolePermissionsService:${role.id}`);

        role.permissions.push(
          ...newPermissions.map((permission) =>
            this.permissionRepo.create(permission),
          ),
        );

        await this.roleRepo.save(role);

        return true;
      }),
    );

    return isUpdated.some((updated) => updated);
  }

  public async updateTwoFaPermissions(request: any): Promise<any> {
    try {
      const permissions = request.twoFaPermissions.map((permission: any) => {
        return {
          user: request.userId,
          permission: permission.permissionId,
          confirmationMethod: permission.confirmationMethodId,
        };
      });

      await this.twoFactorPermissionsRepo.upsert(permissions, [
        'user',
        'permission',
        'confirmationMethod',
      ]);

      return {
        status: true,
        message: 'Permissions created',
      };
    } catch (e) {
      return {
        status: false,
        error: e.message,
        message: 'Failed to update two-factor authentication permissions',
      };
    }
  }

  public async crateTwoFaCode(verificationMethodId: string): Promise<any> {
    const { affected } = await this.userLoginMethods.update(
      { id: verificationMethodId },
      {
        code: randomstring.generate({ length: 6, charset: 'numeric' }),
        codeLifetime: new Date(Date.now() + 5 * 60 * 1000),
      },
    );

    if (affected == 0) {
      throw new Error('Code reset failed');
    }

    return true;
  }

  public async getPermissionsByRole(data: {
    roleId: string;
    type?: string;
  }): Promise<any> {
    try {
      const CACHE_KEY = `rolePermissionsService:${data.roleId}`;
      let permissions: any = await this.cacheManager.get(CACHE_KEY);

      if (!permissions) {
        const rolePermissions = await this.roleRepo.query(
          `
          SELECT p.*
          FROM "RolePermissions" rp
          JOIN "Permissions" p ON rp."permissionsId"::uuid = p.id::uuid
          WHERE rp."rolesId" = $1 AND p."isPublic" = true;`,
          [data.roleId],
        );

        permissions = rolePermissions.map((k) => ({
          id: k.id,
          messagePattern: k.messagePattern,
          method: k.method,
          alias: k.alias,
          description: k.description,
          type: k.type,
          isPublic: k.isPublic,
        }));

        await this.cacheManager.set(CACHE_KEY, permissions, 10 * 1000);
      }

      if (data.type) {
        permissions = permissions.filter((p) => p.type === data.type);
      }

      return {
        status: true,
        message: 'Permissions found',
        permissions: permissions,
      };

      return {
        status: true,
        message: 'Permissions found',
        permissions: permissions,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Permissions not found',
        permissions: [],
      };
    }
  }

  public async getPermissionsByPattern(pattern: string): Promise<any> {
    try {
      const CACHE_KEY = `permissionService:${pattern}`;
      const cachedData = await this.cacheManager.get(CACHE_KEY);

      if (cachedData) {
        return {
          status: true,
          message: 'Permission found',
          permissions: cachedData,
        };
      }

      const permission = await this.permissionRepo.findOne({
        where: {
          messagePattern: pattern,
        },
      });

      if (!permission) {
        return {
          status: false,
          message: 'Permission not found',
          permission: null,
        };
      }

      await this.cacheManager.set(CACHE_KEY, permission, 10 * 1000);

      return {
        status: true,
        message: 'Permission found',
        permission: permission,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Permission not found',
        permission: null,
      };
    }
  }

  private async findDefaultRole(): Promise<RoleEntity[]> {
    return await this.roleRepo.find({
      where: {
        name: In(['USER', 'SUPER_ADMIN', 'ADMIN']),
      },
    });
  }

  private async createDefaultRole(): Promise<void> {
    const defaultRoles = ['USER', 'SUPER_ADMIN', 'ADMIN'];

    const rolesEntities = defaultRoles.map((role) => {
      return RoleEntity.create({
        id: v4(),
        name: role,
        description: role.toLowerCase(),
      });
    });

    await this.roleRepo.save(rolesEntities);
  }
}
