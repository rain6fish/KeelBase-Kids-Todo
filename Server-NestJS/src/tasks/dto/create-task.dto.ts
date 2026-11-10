// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsDateString, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskDto {
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

  @ApiPropertyOptional({ description: '附件 URL（先走 /upload 上传）' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  attachmentUrl?: string;

  @ApiPropertyOptional({ description: '附件原始文件名' })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  attachmentName?: string;

  @ApiProperty({ description: 'priority', enum: ['low', 'medium', 'high'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['low', 'medium', 'high'])
  priority!: string;

  @ApiProperty({ description: 'status', enum: ['todo', 'doing', 'done', 'cancelled'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['todo', 'doing', 'done', 'cancelled'])
  status!: string;

  @ApiProperty({ description: 'taskDate' })
  @IsDateString()
  @IsNotEmpty()
  taskDate!: string;

  @ApiPropertyOptional({ description: 'estimatedMinutes' })
  @IsInt()
  @IsOptional()
  estimatedMinutes?: number;

  @ApiProperty({ description: 'repeatRule', enum: ['none', 'daily', 'weekly', 'monthly'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['none', 'daily', 'weekly', 'monthly'])
  repeatRule!: string;

  @ApiProperty({ description: 'approvalStatus', enum: ['none', 'pending', 'approved', 'rejected'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['none', 'pending', 'approved', 'rejected'])
  approvalStatus!: string;

  @ApiPropertyOptional({ description: 'helpRequested' })
  @IsBoolean()
  @IsOptional()
  helpRequested?: boolean;

  @ApiPropertyOptional({ description: 'helpRequestNote' })
  @IsString()
  @IsOptional()
  helpRequestNote?: string;

  @ApiPropertyOptional({ description: 'sortOrder' })
  @IsInt()
  @IsOptional()
  sortOrder?: number;

  @ApiPropertyOptional({ description: '执行人（通常是孩子）ID' })
  @IsInt()
  @IsOptional()
  assigneeId?: number;
}
