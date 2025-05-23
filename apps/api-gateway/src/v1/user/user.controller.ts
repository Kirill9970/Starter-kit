import { Cache } from '@nestjs/cache-manager';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import {
  acquireLock,
  CustomError,
  ExtendedHttpStatus,
  UserClient,
} from '@crypton-nestjs-kit/common';
import { RedisStore } from 'cache-manager-redis-yet';
import { RedisClientType } from 'redis';

import { Authorization } from '../../decorators/authorization.decorator';
import { CorrelationIdFromRequest } from '../../decorators/correlation-id-from-request.decorator';
import { UserIdFromRequest } from '../../decorators/user-id-from-request.decorator';
import { UserRoleFromRequest } from '../../decorators/user-role-from-request';
import { UsersMeResponseDto } from '../../dto/user-me-respone.dto';
import { RolesGuard } from '../../guards/role.guard';

import {
  CreateConfirmationCodesDto,
  UpdatePermissionDto,
} from './dto/request/users.request.dto';

@ApiTags('User')
@Controller('v1/users')
@UseGuards(RolesGuard)
export class UserController {
  private readonly redisClient: RedisClientType;
  constructor(
    private readonly userClient: UserClient,
    private readonly cacheManager: Cache,
  ) {
    this.redisClient = (this.cacheManager.store as RedisStore).client;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup user confirmation for endpoints' })
  @ApiOkResponse({
    description: 'User info',
    type: UsersMeResponseDto,
  })
  @Authorization(true)
  @Post('permissions')
  async updatePermissions(
    @UserIdFromRequest() userId: string,
    @CorrelationIdFromRequest() traceId: string,
    @Body() body: UpdatePermissionDto,
  ): Promise<any> {
    const data = await this.userClient.updateTwoFaPermissions({
      userId,
      twoFaPermissions: [
        {
          permissionId: body.permissionId,
          confirmationMethodId: body.confirmationMethodId,
        },
      ],
    });

    if (!data.status) {
      throw new CustomError(
        ExtendedHttpStatus.FORBIDDEN,
        "Permissions don't created",
      );
    }

    return {
      message: 'User found',
      data,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Getting all of user confirmation methods' })
  @ApiOkResponse({
    description: 'User info',
    type: UsersMeResponseDto,
  })
  @Authorization(true)
  @Get('confirmationMethods')
  async getConfirmationsMethods(
    @UserIdFromRequest() userId: string,
    @CorrelationIdFromRequest() traceId: string,
  ): Promise<any> {
    const data = await this.userClient.getUserConfirmationMethods(
      {
        userId,
      },
      traceId,
    );

    if (!data.status) {
      throw new CustomError(
        ExtendedHttpStatus.FORBIDDEN,
        "Permissions don't created",
      );
    }

    return {
      message: 'User found',
      data,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create confirmation codes' })
  @ApiOkResponse({
    description: 'User info',
    type: UsersMeResponseDto,
  })
  @Authorization(true)
  @Post('confirmationCodes/create')
  async createConfirmationCodes(
    @UserIdFromRequest() userId: string,
    @CorrelationIdFromRequest() traceId: string,
    @Body() body: CreateConfirmationCodesDto,
  ): Promise<any> {
    const lockData = await acquireLock(
      this.redisClient,
      `createConfirmationCodes:${userId}`,
      90,
    );

    if (!lockData.status) {
      throw new CustomError(
        ExtendedHttpStatus.CONFIRMATION_CODE_SENDING_FAILED,
        'Confirmation codes sending error',
        { lockCreatedTime: lockData.lockCreatedTime },
      );
    }

    const data = await this.userClient.createConfirmationCode(
      { userId, permissionId: body.permissionId },
      traceId,
    );

    if (!data.status) {
      throw new CustomError(
        ExtendedHttpStatus.CONFIRMATION_CODE_SENDING_FAILED,
        'Confirmation codes sending error',
        { lockCreatedTime: lockData.lockCreatedTime },
      );
    }

    return {
      message: 'Confirmation codes successfully sent',
      data: {
        confirmationMethods: data.confirmationMethods,
        lockCreatedTime: lockData.lockCreatedTime,
      },
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Getting all of allowed permissions by user' })
  @ApiOkResponse({
    description: 'User info',
    type: UsersMeResponseDto,
  })
  @Authorization(true)
  @Get('allowedPermissions')
  async getAllowedPermissions(
    @UserRoleFromRequest() roleId: string,
    @CorrelationIdFromRequest() traceId: string,
  ): Promise<any> {
    const data = await this.userClient.getPermissionsByRole(roleId, traceId);

    console.log(data);

    if (!data.status) {
      throw new CustomError(
        ExtendedHttpStatus.FORBIDDEN,
        'Permissions not found',
      );
    }

    return {
      message: 'User found',
      data,
    };
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get info about user' })
  @ApiOkResponse({
    description: 'User info',
    type: UsersMeResponseDto,
  })
  @Authorization(true)
  @Get('me')
  async getMe(
    @UserIdFromRequest() userId: string,
    @UserRoleFromRequest() roleId: string,
    @CorrelationIdFromRequest() traceId: string,
  ): Promise<any> {
    const userData = await this.userClient.getMe(
      {
        userId,
      },
      traceId,
    );

    if (!userData.status) {
      throw new CustomError(ExtendedHttpStatus.NOT_FOUND, 'User not found');
    }

    return {
      message: 'User found',
      data: userData.user,
    };
  }
}
