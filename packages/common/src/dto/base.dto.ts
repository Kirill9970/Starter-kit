import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional } from 'class-validator';

export class BaseResponseDto {
  @ApiProperty({ description: 'Response message' })
  message: string | undefined;

  @ApiProperty({ description: 'Response status' })
  status: boolean | undefined;
}

export class TwoFaCodesDto {
  @ApiProperty({
    description: 'Email 2fa code if security mode setups',
    example: 0o00000,
  })
  @IsOptional()
  @IsNumber()
  readonly emailCode!: number;

  @ApiProperty({
    description: 'Phone 2fa code if security mode setups',
    example: 0o00000,
  })
  @IsOptional()
  @IsNumber()
  readonly phoneCode!: number;

  @ApiProperty({
    description: 'Google 2fa code if security mode setups',
    example: 0o00000,
  })
  @IsOptional()
  @IsNumber()
  readonly googleCode!: number;
}
