import { ApiProperty } from '@nestjs/swagger';
// import { BaseRequestDto } from '@crypton-nestjs-kit/common';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TwoFaCodesDto } from '../../dto/base.dto';

export enum ApiKeyType {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

export class CreateApiKeyDto {
  @ApiProperty({ enum: ApiKeyType })
  @IsEnum(ApiKeyType)
  type: ApiKeyType;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Allowed IP addresses',
  })
  @IsArray()
  @IsOptional()
  allowedIps?: string[];

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Permissions (scopes)',
  })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiProperty({
    description: 'Optional 2FA codes for API key creation',
    required: false,
    type: () => TwoFaCodesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TwoFaCodesDto)
  twoFaCodes?: TwoFaCodesDto;
}

export class UpdateApiKeyDto {
  @ApiProperty({
    type: String,
    required: false,
    description: 'Type of api-key',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ type: Boolean, required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Allowed IP addresses',
  })
  @IsArray()
  @IsOptional()
  allowedIps?: string[];

  @ApiProperty({
    type: [String],
    required: false,
    description: 'Permissions (scopes)',
  })
  @IsArray()
  @IsOptional()
  permissions?: string[];

  @ApiProperty({
    description: 'Optional 2FA codes for API key update',
    required: false,
    type: () => TwoFaCodesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TwoFaCodesDto)
  twoFaCodes?: TwoFaCodesDto;
}

export class DeleteApiKeyDto {
  @ApiProperty({
    description: 'Optional 2FA codes for API key delete',
    required: false,
    type: () => TwoFaCodesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TwoFaCodesDto)
  twoFaCodes?: TwoFaCodesDto;
}

export class ApiKeyResponseDto {
  @ApiProperty({ type: String, format: 'uuid' })
  @IsUUID()
  id: string;

  @ApiProperty({ type: String })
  @IsString()
  key: string;

  @ApiProperty({ enum: ApiKeyType })
  @IsEnum(ApiKeyType)
  type: ApiKeyType;

  @ApiProperty({ type: [String] })
  @IsArray()
  allowedIps: string[];

  @ApiProperty({ type: [String] })
  @IsArray()
  permissions: string[];

  @ApiProperty({ type: Boolean })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ type: String })
  @IsString()
  createdAt: string;

  @ApiProperty({ type: String })
  @IsString()
  updatedAt: string;
}
