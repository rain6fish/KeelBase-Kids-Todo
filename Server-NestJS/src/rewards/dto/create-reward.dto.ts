// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateRewardDto {
  @ApiProperty({ description: 'title' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string;

  @ApiPropertyOptional({ description: 'description' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'pointsCost' })
  @IsInt()
  @IsNotEmpty()
  pointsCost!: number;

  @ApiPropertyOptional({ description: 'isActive' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
