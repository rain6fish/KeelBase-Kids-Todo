// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRewardRedemptionDto {
  @ApiProperty({ description: 'rewardId' })
  @IsInt()
  @IsNotEmpty()
  rewardIdId!: number;

  @ApiProperty({ description: 'pointsSpent' })
  @IsInt()
  @IsNotEmpty()
  pointsSpent!: number;

  @ApiPropertyOptional({ description: 'isCancelled' })
  @IsBoolean()
  @IsOptional()
  isCancelled?: boolean;

  @ApiPropertyOptional({ description: 'note' })
  @IsString()
  @IsOptional()
  note?: string;
}
