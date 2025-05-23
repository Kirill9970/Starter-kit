import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

import { PAGE_SIZE, SMALLINT_MAX_VALUE } from '../constants';

export class PaginationQuery {
  @ApiProperty({
    required: false,
    default: 1,
    type: Number,
    description: 'The number of the page to retrieve',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(SMALLINT_MAX_VALUE)
  page = 1;

  @ApiProperty({
    required: false,
    example: PAGE_SIZE,
    default: PAGE_SIZE,
    type: Number,
    description: 'The count of rows to retrieve per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(SMALLINT_MAX_VALUE)
  limit = PAGE_SIZE;

  getSkip(): number {
    return (this.page - 1) * this.limit;
  }
}
