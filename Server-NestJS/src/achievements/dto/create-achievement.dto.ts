// SPDX-License-Identifier: Apache-2.0

import { IsDateString, IsInt, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAchievementDto {
  @ApiPropertyOptional({ description: 'totalPoints' })
  @IsInt()
  @IsOptional()
  totalPoints?: number;

  @ApiPropertyOptional({ description: 'currentStreak' })
  @IsInt()
  @IsOptional()
  currentStreak?: number;

  @ApiPropertyOptional({ description: 'longestStreak' })
  @IsInt()
  @IsOptional()
  longestStreak?: number;

  @ApiPropertyOptional({ description: 'lastActiveDate' })
  @IsDateString()
  @IsOptional()
  lastActiveDate?: string;
}
