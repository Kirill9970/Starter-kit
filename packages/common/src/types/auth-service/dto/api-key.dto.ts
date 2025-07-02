import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export enum ApiKeyType {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
}

export class CreateApiKeyDto {
  @IsString()
  userId?: string;

  @IsEnum(ApiKeyType)
  type: ApiKeyType | undefined;

  @IsArray()
  @IsOptional()
  allowedIps?: string[];

  @IsArray()
  @IsOptional()
  permissions?: string[];
}

export class UpdateApiKeyDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  allowedIps?: string[];

  @IsArray()
  @IsOptional()
  permissions?: string[];
}

export class ApiKeyResponseDto {
  @IsString()
  id!: string;

  @IsString()
  key!: string;

  @IsEnum(ApiKeyType)
  type!: ApiKeyType;

  @IsArray()
  allowedIps!: string[];

  @IsArray()
  permissions!: string[];

  @IsBoolean()
  isActive!: boolean;

  @IsString()
  createdAt!: string;

  @IsString()
  updatedAt!: string;
}

export class ApiKeyValidateDto {
  @IsString()
  rawKey!: string;

  @IsString()
  ip!: string;
}
