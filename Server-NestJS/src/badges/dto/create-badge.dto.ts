// SPDX-License-Identifier: Apache-2.0

import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBadgeDto {
  @ApiProperty({ description: 'name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ description: 'description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'badgeType', enum: ['streak_3', 'streak_7', 'streak_30', 'streak_100', 'points_50', 'points_200', 'points_500', 'perfect_day', 'perfect_week'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['streak_3', 'streak_7', 'streak_30', 'streak_100', 'points_50', 'points_200', 'points_500', 'perfect_day', 'perfect_week'])
  badgeType!: string;

  @ApiPropertyOptional({ description: 'threshold' })
  @IsInt()
  @IsOptional()
  threshold?: number;

  @ApiProperty({ description: 'iconUrl' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  iconUrl!: string;
}
