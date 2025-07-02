import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  API_KEY_ERROR_CODES,
  ApiKeyValidateDto,
  AuthClientPatterns,
  ControllerMeta,
  ControllerType,
  CreateApiKeyDto,
  IApiKeyCreateResponse,
  IApiKeyListResponse,
  IApiKeyRemoveResponse,
  IApiKeyUpdateResponse,
  UpdateApiKeyDto,
} from '@crypton-nestjs-kit/common';

import { ApiKeyService } from '../services/api-key/api-key.service';

@Controller()
export class ApiKeyController {
  constructor(private readonly apiKeyService: ApiKeyService) {}

  @ControllerMeta({
    name: 'Create API key',
    description: 'Create API key for user',
    isPublic: true,
    type: ControllerType.WRITE,
  })
  @MessagePattern(AuthClientPatterns.API_KEY_CREATE)
  async create(
    @Payload() dto: CreateApiKeyDto,
  ): Promise<IApiKeyCreateResponse> {
    try {
      const result = await this.apiKeyService.createApiKey(dto);

      return {
        status: true,
        message: 'API key created',
        result,
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        errorCode: API_KEY_ERROR_CODES.DUPLICATE,
        error: error.message,
      };
    }
  }

  @ControllerMeta({
    name: 'List API keys',
    description: 'List API keys',
    isPublic: true,
    type: ControllerType.READ,
  })
  @MessagePattern(AuthClientPatterns.API_KEY_LIST)
  async list(): Promise<IApiKeyListResponse> {
    const result = await this.apiKeyService.listApiKeys();

    return {
      status: true,
      message: 'API keys list',
      result,
    };
  }

  @MessagePattern('api-key.get')
  async getById(@Payload() id: string) {
    try {
      const result = await this.apiKeyService.getApiKeyById(id);

      return {
        status: true,
        message: 'API key found',
        data: result,
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        errorCode: API_KEY_ERROR_CODES.NOT_FOUND,
        error: error.message,
      };
    }
  }

  @ControllerMeta({
    name: 'Update API key',
    description: 'Update API key params',
    isPublic: true,
    type: ControllerType.WRITE,
  })
  @MessagePattern(AuthClientPatterns.API_KEY_UPDATE)
  async update(
    @Payload() data: { id: string; userId: string; dto: UpdateApiKeyDto },
  ): Promise<IApiKeyUpdateResponse> {
    try {
      const result = await this.apiKeyService.updateApiKey(
        data.id,
        data.userId,
        data.dto,
      );

      return {
        status: true,
        message: 'API key updated',
        result,
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        errorCode: API_KEY_ERROR_CODES.NOT_FOUND,
        error: error.message,
      };
    }
  }

  @ControllerMeta({
    name: 'Remove API key',
    description: 'Remove API key',
    isPublic: true,
    type: ControllerType.WRITE,
  })
  @MessagePattern(AuthClientPatterns.API_KEY_DELETE)
  async remove(
    @Payload() request: { id: string; userId: string },
  ): Promise<IApiKeyRemoveResponse> {
    try {
      const result = await this.apiKeyService.deleteApiKey(request.id);

      return {
        status: true,
        message: result.message,
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        errorCode: API_KEY_ERROR_CODES.NOT_FOUND,
        error: error.message,
      };
    }
  }

  @ControllerMeta({
    name: 'Validate API key',
    description: 'Validate API key',
    isPublic: false,
    type: ControllerType.READ,
    needsPermission: false,
  })
  @MessagePattern(AuthClientPatterns.API_KEY_VALIDATE)
  async validate(@Payload() data: ApiKeyValidateDto): Promise<{
    status: boolean;
    message: string;
    serviceToken: string;
    user: {
      userId: string;
    };
    errorCode?: string;
    error?: string;
  }> {
    try {
      const validateData = await this.apiKeyService.validateApiKey(
        data.rawKey,
        data.ip,
      );

      return {
        status: validateData.status,
        serviceToken: validateData.serviceToken,
        user: {
          userId: validateData.userId,
        },
        message: validateData.status
          ? 'API key is valid'
          : 'API key is invalid',
      };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        serviceToken: null,
        user: null,
        errorCode: API_KEY_ERROR_CODES.FORBIDDEN,
        error: error.message,
      };
    }
  }
}
