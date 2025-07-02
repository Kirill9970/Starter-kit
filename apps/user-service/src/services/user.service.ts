import { Cache } from '@nestjs/cache-manager';
import { Injectable } from '@nestjs/common';
import {
  AuthClient,
  comparePassword,
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
  User,
  UserStatus,
  UserType,
} from '@crypton-nestjs-kit/common';
import type { PermissionEntity } from '@crypton-nestjs-kit/common/build/entities/user/permissions.entity';
import type { RoleEntity } from '@crypton-nestjs-kit/common/build/entities/user/role.entity';
import { SharedPrismaService } from '@crypton-nestjs-kit/prisma';
import { Prisma } from '@crypton-nestjs-kit/prisma/src/shared/generated/shared-client';
import { v4 } from 'uuid';
import { uuid } from 'uuidv4';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const randomstring = require('randomstring');

const filterUser = (user: any) => {
  const { id, username, status, type, referralCode, roles, loginMethods } =
    user;

  return {
    id,
    username,
    status,
    type,
    referralCode,
    loginMethods: loginMethods.map((lm: any) => ({
      method: lm.method,
      login: lm.login,
      isPrimary: lm.isPrimary,
    })),
  };
};

@Injectable()
export class UserService {
  constructor(
    private readonly cacheManager: Cache,
    private readonly authClient: AuthClient,
    private readonly prisma: SharedPrismaService,
  ) {}

  public async registerPermissions(request: any): Promise<any> {
    try {
      await Promise.all(
        request.permissions.map((permission: any) =>
          this.prisma.permissions.upsert({
            where: {
              messagePattern_method: {
                messagePattern: permission.messagePattern,
                method: permission.method,
              },
            },
            update: {
              alias: permission.alias,
              isPublic: permission.isPublic,
              description: permission.description,
            },
            create: permission,
          }),
        ),
      );

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
      const permissions = await this.prisma.permissions.findMany();

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
    const defaultRoles = await this.prisma.roles.findMany({
      where: { name: { in: Object.keys(DefaultRole) } },
      include: {
        RolePermissions: {
          include: {
            Permissions: {
              select: { alias: true },
            },
          },
        },
      },
    });

    const isUpdated = await Promise.all(
      defaultRoles.map(async (role) => {
        const newPermissions = permissions.filter(
          (p) =>
            !role.RolePermissions.some(
              (rp) => rp.Permissions.alias === p.alias,
            ),
        );

        if (newPermissions.length === 0) {
          return false;
        }

        const data: Prisma.RolePermissionsCreateManyInput[] =
          newPermissions.map((p) => ({
            rolesId: role.id,
            permissionsId: p.id as unknown as string,
          }));

        await this.prisma.rolePermissions.createMany({
          data,
          skipDuplicates: true,
        });

        return true;
      }),
    );

    return isUpdated.some(Boolean);
  }

  public async updateTwoFaPermissions(request: any): Promise<any> {
    try {
      const permissions = request.twoFaPermissions.map((permission: any) => {
        return {
          userId: request.userId,
          permissionId: permission.permissionId,
          confirmationMethodId: permission.confirmationMethodId,
        };
      });

      await Promise.all(
        permissions.map((p) =>
          this.prisma.twoFactorPermissions.upsert({
            where: {
              userId_permissionId_confirmationMethodId: {
                userId: p.userId,
                permissionId: p.permissionId,
                confirmationMethodId: p.confirmationMethodId,
              },
            },
            update: {},
            create: p,
          }),
        ),
      );

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

  public async getMe(request: IGetMeRequest): Promise<IGetMeResponse> {
    try {
      const { userId } = request;

      const userData = await this.getUserById({
        userId,
      });

      if (!userData.status) {
        return {
          status: false,
          message: 'User not found',
          user: null,
        };
      }

      const user: any = filterUser(userData.user);

      return {
        status: true,
        message: 'User found',
        user: {
          ...user,
        },
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'User not found',
        user: null,
      };
    }
  }

  public async getUserConfirmationMethods(request: any): Promise<any> {
    try {
      const confirmationMethods = await this.prisma.userLoginMethods.findMany({
        select: {
          id: true,
          method: true,
          login: true,
          isPrimary: true,
        },
        where: {
          userId: request.userId,
        },
      });

      if (confirmationMethods.length === 0) {
        return {
          status: false,
          message: 'Confirmation methods not found',
          confirmationMethods: [],
        };
      }

      return {
        status: true,
        message: 'Confirmation methods found',
        confirmationMethods,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'Confirmation methods not found',
        confirmationMethods: [],
      };
    }
  }

  public async findOrCreateUser(
    data: IFindOrCreateUserRequest,
  ): Promise<IFindOrCreateUserResponse> {
    try {
      const existingUser = await this.findExistingUser(
        data.login,
        UserStatus.ACTIVE,
      );

      if (existingUser) {
        return {
          status: true,
          created: false,
          message: 'User already exists',
          user: existingUser,
        };
      }

      const newUser = await this.createUser(data);

      return {
        status: true,
        message: 'User created successfully',
        created: true,
        user: newUser,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'User creation failed',
        created: false,
        user: null,
      };
    }
  }

  public async createConfirmationCodes(
    userId: v4,
    permissionId: v4,
  ): Promise<ICreateConfirmationCodesResponse> {
    try {
      const data = await this.getUserById({ userId });

      const filteredTwoFaMethods = data.user.twoFaPermissions.filter(
        (twoFaPermission) =>
          twoFaPermission.permission.id === permissionId &&
          !!twoFaPermission.confirmationMethod,
      );

      if (filteredTwoFaMethods.length < 1) {
        return {
          status: false,
          message: 'Confirmation methods for permission not found',
          confirmationMethods: [],
        };
      }

      await Promise.all(
        filteredTwoFaMethods.map((method) =>
          this.crateTwoFaCode(method.confirmationMethod.id),
        ),
      );

      const confirmationMethods = filteredTwoFaMethods.map(
        (method) => method.confirmationMethod.login,
      );

      return {
        status: true,
        message: 'Confirmation codes successfully sent',
        confirmationMethods,
      };
    } catch (e) {
      return {
        status: false,
        error: e.message,
        message: 'Confirmation codes not sent',
        confirmationMethods: [],
      };
    }
  }

  public async nativeLogin(
    data: INativeLoginRequest,
  ): Promise<INativeLoginResponse> {
    try {
      const existingUser = await this.findExistingUser(
        data.login,
        UserStatus.ACTIVE,
      );

      if (!existingUser) {
        return {
          status: true,
          message: 'User not found',
          user: null,
          tokens: null,
        };
      }

      if (!(await comparePassword(data.password, existingUser.password))) {
        return {
          status: false,
          message: 'Invalid password',
          user: null,
          tokens: null,
        };
      }

      const { status, tokens, message } = await this.createAccessData({
        userId: existingUser.id,
        userAgent: data.userAgent,
        userIp: data.userIp,
        fingerprint: data.fingerprint,
        country: data.country,
        city: data.city,
        traceId: data.traceId,
      });

      if (!status) {
        return {
          status: false,
          message: 'Access token creation failed',
          user: null,
          tokens: null,
        };
      }

      return {
        status: true,
        message: 'User authenticated successfully',
        user: {
          id: existingUser.id,
          login: existingUser.login,
        },
        tokens,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'User authentication failed',
        user: null,
        tokens: null,
      };
    }
  }

  public async registrationConfirm(data: any): Promise<any> {
    try {
      const userLoginMethod = await this.prisma.userLoginMethods.findFirst({
        where: {
          login: data.login,
          User: {
            status: UserStatus.INACTIVE,
          },
        },
        select: {
          id: true,
          login: true,
          method: true,
          code: true,
          codeLifetime: true,
          userId: true,
        },
      });

      if (!userLoginMethod) {
        return {
          status: false,
          message: 'User not found',
          user: null,
        };
      }

      if (
        +userLoginMethod.code !== +data.code ||
        userLoginMethod.codeLifetime < new Date()
      ) {
        return {
          status: false,
          message: 'Invalid code or code expired',
          user: null,
        };
      }

      await this.activateUser(userLoginMethod.userId);
      await this.resetConfirmationCode(
        userLoginMethod.login,
        userLoginMethod.userId,
      );

      return {
        status: true,
        message: 'Account successfully confirmed',
      };
    } catch (e) {
      return {
        status: false,
        error: e.message,
        message: 'Account confirmation failed',
      };
    }
  }

  private async findExistingUser(
    login: string,
    status: UserStatus,
  ): Promise<{
    id: string;
    password: string;
    login: string;
    role: string;
  }> {
    const userLoginMethod = await this.prisma.userLoginMethods.findFirst({
      where: {
        login,
        User: {
          status,
        },
      },
      select: {
        login: true,
        method: true,
        User: {
          select: {
            id: true,
            password: true,
            UserRoles: {
              select: {
                Roles: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userLoginMethod) {
      return null;
    }

    return {
      id: userLoginMethod.User.id,
      password: userLoginMethod.User.password,
      login: userLoginMethod.login,
      role: userLoginMethod.User.UserRoles.map((r) => r.Roles.name).join(','),
    };
  }

  private async createAccessData(data: ISessionCreateRequest): Promise<{
    status: boolean;
    message: string;
    tokens: any;
  }> {
    const sessionData = await this.authClient.sessionCreate(
      {
        userId: data.userId,
        userAgent: data.userAgent,
        userIp: data.userIp,
        role: data.role,
        country: data.country,
        fingerprint: data.fingerprint,
        city: data.city,
        traceId: data.traceId,
      },
      data.traceId,
    );

    if (!sessionData.status) {
      return {
        status: false,
        message: 'Session creation failed',
        tokens: null,
      };
    }

    const tokensData = await this.authClient.tokensCreate(
      {
        userId: data.userId,
        sessionId: sessionData.sessionId,
      },
      data.traceId,
    );

    if (!tokensData.status) {
      return {
        status: false,
        message: 'Session creation failed',
        tokens: null,
      };
    }

    return {
      status: true,
      message: 'Access data created successfully',
      tokens: tokensData.tokens,
    };
  }

  private async createUser(data: IFindOrCreateUserRequest): Promise<any> {
    const role = await this.prisma.roles.findFirst({ where: { name: 'USER' } });

    if (!role) {
      throw new Error('Role "USER" not found');
    }

    const USERNAME_PREFIX = 'user_';
    const referralCode = randomstring.generate({
      length: 10,
      charset: 'numeric',
    });
    const uniqueUsernameNumber = randomstring.generate({
      length: 10,
      charset: 'numeric',
    });

    const userId = uuid();
    const username = `${USERNAME_PREFIX}${uniqueUsernameNumber}`;

    const newUser = await this.prisma.user.create({
      data: {
        id: userId,
        username,
        referralCode: referralCode as number,
        password: await hashPassword(data.password),

        UserLoginMethods: {
          create: {
            id: uuid(),
            method:
              LoginMethod[
                data.loginType.toUpperCase() as keyof typeof LoginMethod
              ],
            login: data.login,
            code: randomstring.generate({ length: 6, charset: 'numeric' }),
            codeLifetime: new Date(Date.now() + 5 * 60 * 1000),
          },
        },

        UserRoles: {
          create: {
            id: uuid(),
            roleId: role.id,
          },
        },
      },
    });

    return {
      id: newUser.id,
      role: newUser.type,
      login: data.login,
      createdAt: newUser.createdAt,
    };
  }

  private async activateUser(userId: string): Promise<any> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { status: UserStatus.ACTIVE, updatedAt: new Date() },
    });
  }

  async resetConfirmationCode(
    login?: string,
    userId?: string,
    id?: string,
  ): Promise<any> {
    try {
      const where: { userId?: string; login?: string; id?: string } = {};

      if (!id) {
        if (userId) where.userId = userId;

        if (login) where.login = login;
      }

      where.id = id;

      if (!where) {
        throw new Error('Code reset failed');
      }

      const loginMethod = await this.prisma.userLoginMethods.findFirst({
        where,
      });

      if (!loginMethod) {
        throw new Error('Code reset failed');
      }

      await this.prisma.userLoginMethods.update({
        where: { id: loginMethod.id },
        data: {
          code: null,
          codeLifetime: null,
        },
      });

      await this.cacheManager.del(`getUserById:${loginMethod.userId}`);

      return true;
    } catch (e) {
      return false;
    }
  }

  public async regenerateConfirmationCode(
    userId: string,
    verificationMethod: string,
  ): Promise<any> {
    const result = await this.prisma.userLoginMethods.updateMany({
      where: { userId: userId, login: verificationMethod },
      data: {
        code: randomstring.generate({ length: 6, charset: 'numeric' }),
        codeLifetime: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    if (result.count === 0) {
      throw new Error('Code reset failed');
    }
  }

  public async crateTwoFaCode(verificationMethodId: string): Promise<any> {
    await this.prisma.userLoginMethods.update({
      where: { id: verificationMethodId },
      data: {
        code: randomstring.generate({ length: 6, charset: 'numeric' }),
        codeLifetime: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    return true;
  }

  /* eslint-disable-next-line max-lines-per-function */
  public async getUserById(
    data: IGetUserByIdRequest,
  ): Promise<IGetUserByIdResponse> {
    try {
      const CACHE_KEY = `getUserById:${data.userId}`;
      let cachedData = await this.cacheManager.get(CACHE_KEY);

      cachedData = undefined;

      if (cachedData) {
        return {
          status: true,
          message: 'User exists',
          user: JSON.parse(cachedData.toString()),
        };
      }

      const prismaUser = await this.prisma.user.findUnique({
        where: {
          id: data.userId,
        },
        include: {
          UserRoles: {
            include: {
              Roles: true,
            },
          },
          UserLoginMethods: true,
          TwoFactorPermissions: {
            include: {
              Permissions: true,
              UserLoginMethods: true,
            },
          },
        },
      });

      if (!prismaUser) {
        return {
          status: false,
          message: 'User not found',
          user: null,
        };
      }

      type UserWithRelations = Prisma.UserGetPayload<{
        include: {
          UserRoles: { include: { Roles: true } };
          UserLoginMethods: true;
          TwoFactorPermissions: {
            include: { Permissions: true; UserLoginMethods: true };
          };
        };
      }>;

      const userWithRelations: UserWithRelations = {
        ...prismaUser,
        roles: prismaUser.UserRoles?.map((ur) => ur.Roles) || [],
        loginMethods: prismaUser.UserLoginMethods || [],
        twoFaPermissions:
          prismaUser.TwoFactorPermissions?.map((tp) => ({
            ...tp,
            permission: tp.Permissions,
            confirmationMethod: tp.UserLoginMethods,
          })) || [],
      } as UserWithRelations;

      // Map DB specific fields/enums to SDK compatible structure expected by the contracts
      const {
        extra_data, // eslint-disable-line @typescript-eslint/naming-convention
        status,
        type,
        ...rest
      } = userWithRelations as unknown as any;

      const safeUser = {
        ...rest,
        // Map snake_case DB column to camelCase property expected by consumers
        extraData: extra_data,
        // Cast enum values so that typings are compatible with @crypton-nestjs-kit/common enums
        status: status as unknown as UserStatus,
        type: type as unknown as UserType,
        referralCode:
          userWithRelations.referralCode instanceof Prisma.Decimal
            ? userWithRelations.referralCode.toNumber()
            : (userWithRelations.referralCode as number),
      } as Partial<User>;

      await this.cacheManager.set(
        CACHE_KEY,
        JSON.stringify(safeUser),
        60 * 1000,
      );

      return {
        status: true,
        message: 'User exists',
        user: safeUser,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'User not found',
        user: null,
      };
    }
  }

  public async getUserByLogin(
    data: IGetUserByLoginRequest,
  ): Promise<IGetUserByIdResponse> {
    try {
      const CACHE_KEY = `getUserByLogin:${data.login}`;

      const cachedData = await this.cacheManager.get(CACHE_KEY);

      if (cachedData) {
        return {
          status: true,
          message: 'User exists',
          user: JSON.parse(cachedData.toString()),
        };
      }

      const userLoginMethod = await this.prisma.userLoginMethods.findFirst({
        where: {
          login: data.login,
        },
        select: {
          login: true,
          method: true,
          User: {
            select: {
              id: true,
              password: true,
            },
          },
        },
      });

      if (!userLoginMethod) {
        return {
          status: false,
          message: 'User not found',
          user: null,
        };
      }

      const safeLoginUser: Partial<User> = {
        id: userLoginMethod.User.id,
        loginMethods: [
          {
            login: userLoginMethod.login,
            method: userLoginMethod.method,
          },
        ],
        password: userLoginMethod.User.password,
      };

      await this.cacheManager.set(
        CACHE_KEY,
        JSON.stringify(safeLoginUser),
        60 * 1000,
      );

      return {
        status: true,
        message: 'User exists',
        user: safeLoginUser,
      };
    } catch (e) {
      return {
        error: e.message,
        status: false,
        message: 'User not found',
        user: null,
      };
    }
  }

  public async getPermissionsByRole(roleId: string): Promise<any> {
    try {
      const CACHE_KEY = `rolePermissions:${roleId}`;
      const cachedData = await this.cacheManager.get(CACHE_KEY);

      if (cachedData) {
        const data = JSON.parse(cachedData.toString());

        return {
          status: true,
          message: 'Permissions found',
          permissions: data.permissions,
        };
      }

      const role = await this.prisma.roles.findUnique({
        where: { id: roleId },
        include: {
          RolePermissions: {
            include: {
              Permissions: true,
            },
          },
        },
      });

      await this.cacheManager.set(CACHE_KEY, JSON.stringify(role), 10 * 1000);

      return {
        status: true,
        message: 'Permissions found',
        permissions: role?.RolePermissions?.map((rp) => rp.Permissions) || [],
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

  private async findDefaultRole(): Promise<RoleEntity[]> {
    return (await this.prisma.roles.findMany({
      where: {
        name: {
          in: ['USER', 'SUPER_ADMIN', 'ADMIN'],
        },
      },
    })) as unknown as RoleEntity[];
  }

  private async createDefaultRole(): Promise<void> {
    const defaultRoles = ['USER', 'SUPER_ADMIN', 'ADMIN'];

    const rolesEntities = defaultRoles.map((role) => {
      return {
        id: v4(),
        name: role,
        description: role.toLowerCase(),
      };
    });

    await this.prisma.roles.createMany({
      data: rolesEntities,
    });
  }
}
