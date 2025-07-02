import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import {
  API_KEY_ERROR_CODES,
  apiKeyErrorMessages,
  ApiKeyType,
  CreateApiKeyDto,
  decrypt,
  encrypt,
  IApiKey,
  ServiceJwtGenerator,
  UpdateApiKeyDto,
  UserClient,
} from '@crypton-nestjs-kit/common';
import { SharedPrismaService } from '@crypton-nestjs-kit/prisma';
import * as crypto from 'crypto';

const API_KEY_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const API_KEY_CACHE_SLICE_LENGTH = 24;
const API_KEY_VALIDATE_CACHE_PREFIX = 'api-key-validate';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: SharedPrismaService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly serviceJwtGenerator: ServiceJwtGenerator,
    private readonly userClient: UserClient,
  ) {}

  async createApiKey(dto: CreateApiKeyDto): Promise<IApiKey> {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const encryptedKey = encrypt(rawKey);
    const encryptedAllowedIps = dto.allowedIps?.map((ip) => encrypt(ip)) || [];
    const encryptedAllowedPermissions =
      dto.permissions?.map((permission) => encrypt(permission)) || [];

    const now = new Date();
    const expiredAt = new Date(now.getTime() + API_KEY_TTL);

    const apiKey = await this.prisma.apiKeys.create({
      data: {
        userId: dto.userId,
        encryptedKey,
        type: dto.type,
        encryptedAllowedIps,
        permissions: encryptedAllowedPermissions,
        isActive: true,
        expiredAt,
      },
    });

    await this.cacheManager.set(
      `${API_KEY_VALIDATE_CACHE_PREFIX}:${rawKey.slice(
        0,
        API_KEY_CACHE_SLICE_LENGTH,
      )}`,
      {
        userId: dto.userId,
        encryptedAllowedIps: encryptedAllowedIps,
        permissions: encryptedAllowedPermissions,
        isActive: true,
      },
      API_KEY_TTL,
    );

    return {
      id: apiKey.id,
      key: rawKey,
      type: apiKey.type as ApiKeyType,
      allowedIps: dto.allowedIps || [],
      permissions: apiKey.permissions || [],
      isActive: apiKey.isActive,
      expiredAt: apiKey.expiredAt.toISOString(),
      createdAt: apiKey.createdAt.toISOString(),
    };
  }

  async listApiKeys(): Promise<IApiKey[]> {
    const keys = await this.prisma.apiKeys.findMany();

    return keys.map((k) => ({
      id: k.id,
      key: decrypt(k.encryptedKey),
      type: k.type as ApiKeyType,
      allowedIps: (k.encryptedAllowedIps || []).map(decrypt),
      permissions: k.permissions || [],
      isActive: k.isActive,
      expiredAt: k.expiredAt.toISOString(),
      createdAt: k.createdAt.toISOString(),
    }));
  }

  async updateApiKey(
    id: string,
    userId: string,
    dto: UpdateApiKeyDto,
  ): Promise<IApiKey> {
    const apiKey = await this.prisma.apiKeys.findUnique({ where: { id } });

    if (!apiKey) {
      throw new Error(apiKeyErrorMessages[API_KEY_ERROR_CODES.NOT_FOUND]);
    }

    const fieldMap: Record<string, (value: any) => any> = {
      allowedIps: (ips: string[]) => ips.map((ip) => encrypt(ip)),
      permissions: (permissions: string[]) =>
        permissions.map((permission) => encrypt(permission)),
    };

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        if (fieldMap[key]) {
          apiKey[`encrypted${key.charAt(0).toUpperCase()}${key.slice(1)}`] =
            fieldMap[key](value);
          apiKey[key] = fieldMap[key](value);
        } else {
          apiKey[key] = value;
        }
      }
    });

    await this.prisma.apiKeys.update({
      where: { id },
      data: apiKey,
    });
    await this.cacheManager.set(
      `${API_KEY_VALIDATE_CACHE_PREFIX}:${decrypt(apiKey.encryptedKey).slice(
        0,
        API_KEY_CACHE_SLICE_LENGTH,
      )}`,
      {
        userId,
        encryptedAllowedIps: apiKey.encryptedAllowedIps,
        permissions:
          dto.permissions?.map((permission) => encrypt(permission)) || [],
        isActive: apiKey.isActive,
      },
      API_KEY_TTL,
    );

    return {
      id: apiKey.id,
      key: decrypt(apiKey.encryptedKey),
      type: apiKey.type as ApiKeyType,
      allowedIps: (apiKey.encryptedAllowedIps || []).map(decrypt),
      permissions: apiKey.permissions || [],
      expiredAt: apiKey.expiredAt.toISOString(),
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt.toISOString(),
    };
  }

  async deleteApiKey(
    id: string,
  ): Promise<{ status: boolean; message: string }> {
    const apiKey = await this.prisma.apiKeys.findUnique({ where: { id } });

    if (!apiKey) {
      throw new Error(apiKeyErrorMessages[API_KEY_ERROR_CODES.NOT_FOUND]);
    }

    await this.prisma.apiKeys.delete({ where: { id } });
    // Инвалидация кэша по id и списку
    await this.cacheManager.del(
      `${API_KEY_VALIDATE_CACHE_PREFIX}:${decrypt(apiKey.encryptedKey).slice(
        0,
        API_KEY_CACHE_SLICE_LENGTH,
      )}`,
    );

    return { status: true, message: 'API key deleted' };
  }

  async getApiKeyById(id: string): Promise<IApiKey> {
    const apiKey = await this.prisma.apiKeys.findUnique({ where: { id } });

    if (!apiKey) {
      throw new Error(apiKeyErrorMessages[API_KEY_ERROR_CODES.NOT_FOUND]);
    }

    const result: IApiKey = {
      id: apiKey.id,
      key: apiKey.encryptedKey,
      type: apiKey.type as ApiKeyType,
      allowedIps: (apiKey.encryptedAllowedIps || []).map(decrypt),
      permissions: apiKey.permissions || [],
      isActive: apiKey.isActive,
      expiredAt: apiKey.expiredAt.toISOString(),
      createdAt: apiKey.createdAt.toISOString(),
    };

    return result;
  }

  async validateApiKey(
    rawKey: string,
    ip: string,
  ): Promise<{
    status: boolean;
    serviceToken?: string;
    userId: string;
  }> {
    const cacheKey = `${API_KEY_VALIDATE_CACHE_PREFIX}:${rawKey.slice(
      0,
      API_KEY_CACHE_SLICE_LENGTH,
    )}`;

    let keyData = await this.cacheManager.get<{
      userId: string;
      encryptedAllowedIps: string[];
      permissions: string[];
      isActive: boolean;
      expiredAt?: string;
    }>(cacheKey);

    if (!keyData) {
      const apiKeys = await this.prisma.apiKeys.findMany();
      const apiKey = apiKeys.find(
        (key) => decrypt(key.encryptedKey) === rawKey,
      );

      if (!apiKey) {
        return {
          status: false,
          userId: null,
          serviceToken: null,
        };
      }

      keyData = {
        userId: apiKey.userId,
        encryptedAllowedIps: apiKey.encryptedAllowedIps,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        expiredAt: apiKey.expiredAt?.toISOString(),
      };
    }

    await this.cacheManager.set(cacheKey, keyData, API_KEY_TTL);

    if (!keyData.isActive) {
      return {
        status: false,
        userId: null,
        serviceToken: null,
      };
    }

    if (keyData.expiredAt && new Date(keyData.expiredAt) < new Date()) {
      return {
        status: false,
        userId: null,
        serviceToken: null,
      };
    }

    if (!keyData.encryptedAllowedIps?.length) {
      return {
        status: true,
        userId: keyData.userId,
        serviceToken: await this.serviceJwtGenerator.generateServiceJwt({
          subject: `api-key:${rawKey}`,
          actor: 'api-key-service',
          issuer: 'api-gateway',
          audience: 'service',
          type: 'api-key',
          expiresIn: '5m',
          permissions: keyData.permissions.map(decrypt),
        }),
      };
    }

    if (!keyData.encryptedAllowedIps.map(decrypt).includes(ip)) {
      return {
        status: false,
        userId: null,
        serviceToken: null,
      };
    }

    return {
      status: true,
      userId: keyData.userId,
      serviceToken: await this.serviceJwtGenerator.generateServiceJwt({
        subject: `api-key:${rawKey}`,
        actor: 'api-key-service',
        issuer: 'api-gateway',
        audience: 'service',
        type: 'api-key',
        expiresIn: '5m',
        permissions: keyData.permissions.map(decrypt),
      }),
    };
  }
}
