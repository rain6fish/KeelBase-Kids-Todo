// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsDateString, IsInt, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCheckinDto {
  @ApiProperty({ description: 'checkDate' })
  @IsDateString()
  @IsNotEmpty()
  checkDate!: string;

  @ApiPropertyOptional({ description: 'totalTasks' })
  @IsInt()
  @IsOptional()
  totalTasks?: number;

  @ApiPropertyOptional({ description: 'doneTasks' })
  @IsInt()
  @IsOptional()
  doneTasks?: number;

  @ApiPropertyOptional({ description: 'isPerfect' })
  @IsBoolean()
  @IsOptional()
  isPerfect?: boolean;

  @ApiPropertyOptional({ description: 'pointsEarned' })
  @IsInt()
  @IsOptional()
  pointsEarned?: number;
}
