import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiExtraModels,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  AuthClient,
  CustomError,
  ExtendedHttpStatus,
  IApiKeyCreateResponse,
  IApiKeyListResponse,
  IApiKeyRemoveResponse,
  IApiKeyUpdateResponse,
  UserClient,
} from '@crypton-nestjs-kit/common';

import { Authorization } from '../../decorators/authorization.decorator';
import { CorrelationIdFromRequest } from '../../decorators/correlation-id-from-request.decorator';
import { ServiceTokenFromRequest } from '../../decorators/service-token-from-request.decorator';
import { UserIdFromRequest } from '../../decorators/user-id-from-request.decorator';
import { UserRoleFromRequest } from '../../decorators/user-role-from-request';
import { ApiKeyGuard } from '../../guards/api-key.guard';

import {
  ApiKeyResponseDto,
  CreateApiKeyDto,
  DeleteApiKeyDto,
  UpdateApiKeyDto,
} from './api-key.dto';

@ApiTags('API Keys')
@ApiBearerAuth()
@ApiExtraModels(ApiKeyResponseDto)
@Controller('v1/api-keys')
export class ApiKeyController {
  constructor(
    private readonly authClient: AuthClient,
    private readonly userClient: UserClient,
  ) {}

  @Get('allowed-permissions')
  @ApiOperation({ summary: 'Getting all of allowed permissions' })
  @ApiOkResponse({
    description: 'All allowed permissions list',
  })
  @ApiBearerAuth()
  @Authorization(true)
  async getAllowedPermissions(
    @UserRoleFromRequest() roleId: string,
    @CorrelationIdFromRequest() traceId: string,
    @ServiceTokenFromRequest() serviceToken: string,
  ): Promise<any> {
    const data = await this.userClient.getPermissionsByRole(
      { roleId },
      traceId,
      serviceToken,
    );

    if (!data.status) {
      throw new CustomError(
        ExtendedHttpStatus.FORBIDDEN,
        'Permissions not found',
      );
    }

    return data;
  }

  @ApiOperation({ summary: 'Api key test endpoint' })
  @ApiHeader({
    name: 'x-api-key',
    description: 'API Key. Необходим для доступа к этому эндпоинту',
    required: true,
  })
  @Authorization(true)
  @Get('test')
  async apiKeyTest(
    @CorrelationIdFromRequest() traceId: string,
    @ServiceTokenFromRequest() serviceToken: string,
    @UserIdFromRequest() userId: string,
  ): Promise<any> {
    const userData = await this.userClient.getMe(
      {
        userId,
      },
      traceId,
      serviceToken,
    );

    return userData;
  }

  /**
   * Create a new API key
   * @param dto - API key creation data
   * @param traceId
   * @param userId
   * @param serviceToken
   * @returns Created API key
   */
  @Post()
  @ApiOperation({
    summary: 'Create API key',
    description: `Creates a new API key with specified type, permissions and allowed IPs.\nThe key will be shown only once after creation.`,
  })
  @ApiBody({ type: CreateApiKeyDto })
  @ApiResponse({
    status: 201,
    description: 'API key created',
    schema: { $ref: getSchemaPath(ApiKeyResponseDto) },
  })
  @ApiResponse({ status: 400, description: 'Invalid input or duplicate key' })
  @ApiBearerAuth()
  @Authorization(true)
  async create(
    @Body() dto: CreateApiKeyDto,
    @CorrelationIdFromRequest() traceId: string,
    @UserIdFromRequest() userId: string,
    @ServiceTokenFromRequest() serviceToken: string,
  ): Promise<IApiKeyCreateResponse> {
    const result = await this.authClient.apiKeyCreate(
      {
        userId,
        type: dto.type,
        permissions: dto.permissions,
        allowedIps: dto.allowedIps,
      },
      traceId,
      serviceToken,
    );

    if (!result.status) {
      throw new HttpException(result, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  /**
   * Get all API keys
   * @returns List of API keys
   */
  @Get()
  @ApiOperation({
    summary: 'List all API keys',
    description:
      'Returns a list of all API keys with their metadata (key, type, permissions, allowed IPs, status, etc.)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of API keys',
    schema: {
      type: 'array',
      items: { $ref: getSchemaPath(ApiKeyResponseDto) },
    },
  })
  @ApiBearerAuth()
  @Authorization(true)
  async list(
    @CorrelationIdFromRequest() traceId: string,
    @ServiceTokenFromRequest() serviceToken: string,
  ): Promise<IApiKeyListResponse> {
    const result = await this.authClient.apiKeyList(traceId, serviceToken);

    if (!result.status) {
      throw new HttpException(result, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  /**
   * Get API key by ID
   * @param id - API key ID
   * @returns API key data
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get API key by ID',
    description: 'Returns API key data by its unique identifier',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'API key UUID' })
  @ApiResponse({
    status: 200,
    description: 'API key found',
    schema: { $ref: getSchemaPath(ApiKeyResponseDto) },
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiBearerAuth()
  @Authorization(true)
  async getById(@Param('id') id: string) {
    // const result = await this.authServiceClient
    //   .send('api-key.get', id)
    //   .toPromise();
    //
    // if (!result.status) {
    //   throw new HttpException(result, HttpStatus.NOT_FOUND);
    // }
    //
    // return result.data;
  }

  /**
   * Update API key
   * @param id - API key ID
   * @param dto - Update data
   * @param traceId
   * @param serviceToken
   * @param userId
   * @returns Updated API key
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update API key',
    description: 'Updates API key metadata (permissions, allowed IPs, status)',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'API key UUID' })
  @ApiBody({ type: UpdateApiKeyDto })
  @ApiResponse({
    status: 200,
    description: 'API key updated',
    schema: { $ref: getSchemaPath(ApiKeyResponseDto) },
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiBearerAuth()
  @Authorization(true)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateApiKeyDto,
    @CorrelationIdFromRequest() traceId: string,
    @ServiceTokenFromRequest() serviceToken: string,
    @UserIdFromRequest() userId: string,
  ): Promise<IApiKeyUpdateResponse> {
    const result = await this.authClient.apiKeyUpdate(
      {
        userId,
        id,
        dto: {
          type: dto.type,
          permissions: dto.permissions,
          allowedIps: dto.allowedIps,
        },
      },
      traceId,
      serviceToken,
    );

    if (!result.status) {
      throw new HttpException(result, HttpStatus.BAD_REQUEST);
    }

    return result;
  }

  /**
   * Delete API key
   * @param id - API key ID
   * @param traceId
   * @param serviceToken
   * @returns Deletion result
   */
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete API key',
    description: 'Deletes API key by its unique identifier',
  })
  @ApiParam({ name: 'id', type: 'string', description: 'API key UUID' })
  @ApiResponse({
    status: 200,
    description: 'API key deleted',
    schema: {
      example: { status: true, message: 'API key deleted' },
    },
  })
  @ApiResponse({ status: 404, description: 'API key not found' })
  @ApiBearerAuth()
  @Authorization(true)
  async remove(
    @Param('id') id: string,
    @CorrelationIdFromRequest() traceId: string,
    @ServiceTokenFromRequest() serviceToken: string,
    @UserIdFromRequest() userId: string,
    @Body() body: DeleteApiKeyDto,
  ): Promise<IApiKeyRemoveResponse> {
    const result = await this.authClient.apiKeyRemove(
      { id, userId },
      traceId,
      serviceToken,
    );

    if (!result.status) {
      throw new HttpException(result, HttpStatus.BAD_REQUEST);
    }

    return result;
  }
}
