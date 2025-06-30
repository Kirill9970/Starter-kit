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
  UpdateApiKeyDto,
} from '@crypton-nestjs-kit/common';
import { PrismaService } from '@crypton-nestjs-kit/prisma';
import * as crypto from 'crypto';

const API_KEY_TTL = 30 * 24 * 60 * 60 * 1000; // 30 days
const API_KEY_CACHE_SLICE_LENGTH = 24;
const API_KEY_VALIDATE_CACHE_PREFIX = 'api-key-validate';

@Injectable()
export class ApiKeyService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  async createApiKey(dto: CreateApiKeyDto): Promise<IApiKey> {
    const rawKey = crypto.randomBytes(32).toString('hex');
    const encryptedKey = encrypt(rawKey);
    const encryptedAllowedIps = dto.allowedIps?.map((ip) => encrypt(ip)) || [];

    const now = new Date();
    const expiredAt = new Date(now.getTime() + API_KEY_TTL);

    const apiKey = await this.prisma.apiKeys.create({
      data: {
        encryptedKey,
        type: dto.type,
        encryptedAllowedIps,
        permissions: dto.permissions,
        isActive: true,
        expiredAt,
      },
    });

    await this.cacheManager.set(
      `${API_KEY_VALIDATE_CACHE_PREFIX}:${rawKey.slice(
        0,
        API_KEY_CACHE_SLICE_LENGTH,
      )}`,
      { encryptedAllowedIps, permissions: dto.permissions, isActive: true },
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

  async updateApiKey(id: string, dto: UpdateApiKeyDto): Promise<IApiKey> {
    const apiKey = await this.prisma.apiKeys.findUnique({ where: { id } });

    if (!apiKey) {
      throw new Error(apiKeyErrorMessages[API_KEY_ERROR_CODES.NOT_FOUND]);
    }

    const fieldMap: Record<string, (value: any) => any> = {
      allowedIps: (ips: string[]) => ips.map((ip) => encrypt(ip)),
    };

    Object.entries(dto).forEach(([key, value]) => {
      if (value !== undefined) {
        if (fieldMap[key]) {
          apiKey[`encrypted${key.charAt(0).toUpperCase()}${key.slice(1)}`] =
            fieldMap[key](value);
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
        encryptedAllowedIps: apiKey.encryptedAllowedIps,
        permissions: dto.permissions,
        isActive: apiKey.isActive,
      },
      API_KEY_TTL,
    );

    return {
      id: apiKey.id,
      key: apiKey.encryptedKey,
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

  async validateApiKey(rawKey: string, ip: string): Promise<boolean> {
    const cacheKey = `${API_KEY_VALIDATE_CACHE_PREFIX}:${rawKey.slice(
      0,
      API_KEY_CACHE_SLICE_LENGTH,
    )}`;

    let keyData = await this.cacheManager.get<{
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

      if (!apiKey) return false;

      keyData = {
        encryptedAllowedIps: apiKey.encryptedAllowedIps,
        permissions: apiKey.permissions,
        isActive: apiKey.isActive,
        expiredAt: apiKey.expiredAt?.toISOString(),
      };
    }

    await this.cacheManager.set(cacheKey, keyData, API_KEY_TTL);

    if (!keyData.isActive) return false;

    if (keyData.expiredAt && new Date(keyData.expiredAt) < new Date())
      return false;

    if (!keyData.encryptedAllowedIps?.length) {
      return true;
    }

    return keyData.encryptedAllowedIps.map(decrypt).includes(ip);
  }
}
