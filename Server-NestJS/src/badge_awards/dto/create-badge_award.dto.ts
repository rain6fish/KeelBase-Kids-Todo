// SPDX-License-Identifier: Apache-2.0

import { IsDateString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBadgeAwardDto {
  @ApiProperty({ description: 'badgeId' })
  @IsInt()
  @IsNotEmpty()
  badgeIdId!: number;

  @ApiPropertyOptional({ description: 'earnedOn' })
  @IsDateString()
  @IsOptional()
  earnedOn?: string;
}
