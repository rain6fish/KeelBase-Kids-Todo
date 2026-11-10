// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFamilieDto {
  @ApiProperty({ description: 'name' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiProperty({ description: 'inviteCode' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  inviteCode!: string;

  @ApiPropertyOptional({ description: 'approvalMode' })
  @IsBoolean()
  @IsOptional()
  approvalMode?: boolean;

  @ApiProperty({ description: 'useTimeStart' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  useTimeStart!: string;

  @ApiProperty({ description: 'useTimeEnd' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  useTimeEnd!: string;
}
