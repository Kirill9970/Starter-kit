import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { TwoFaCodesDto } from '../../../dto/base.dto';

export class SessionInfoDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  userId: string;

  @ApiProperty({ example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' })
  userAgent?: string;

  @ApiProperty({ example: '192.168.1.1' })
  userIp?: string;

  @ApiProperty({ example: 'Russia' })
  country?: string;

  @ApiProperty({ example: 'Moscow' })
  city?: string;

  @ApiProperty({ example: 'abc123' })
  fingerprint?: string;

  @ApiProperty({ example: 'active' })
  status: string;

  @ApiProperty({ example: '2024-03-20T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-03-20T11:00:00Z' })
  updatedAt: Date;
}

export class SessionResponseDto {
  @ApiProperty({ type: [SessionInfoDto] })
  sessions: SessionInfoDto[];

  @ApiProperty({ example: 'Sessions found' })
  message: string;

  @ApiProperty({ example: 10 })
  count?: number;
}

export class TerminateSessionDto {
  @ApiProperty({
    description: 'Optional 2FA codes for session termination',
    required: false,
    type: () => TwoFaCodesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TwoFaCodesDto)
  twoFaCodes?: TwoFaCodesDto;
}

export class TerminateAllSessionsDto {
  @ApiProperty({
    description: 'Optional 2FA codes for session termination',
    required: false,
    type: () => TwoFaCodesDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => TwoFaCodesDto)
  twoFaCodes?: TwoFaCodesDto;
}

export class GetSessionsHistoryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  page?: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
    default: 10,
  })
  @IsOptional()
  limit?: number;
}
