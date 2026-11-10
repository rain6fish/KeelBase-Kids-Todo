// SPDX-License-Identifier: Apache-2.0

import { IsDateString, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDailyReviewDto {
  @ApiProperty({ description: 'reviewDate' })
  @IsDateString()
  @IsNotEmpty()
  reviewDate!: string;

  @ApiProperty({ description: 'content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiPropertyOptional({ description: 'rating' })
  @IsInt()
  @IsOptional()
  rating?: number;
}
