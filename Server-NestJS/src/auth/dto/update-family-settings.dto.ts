// SPDX-License-Identifier: Apache-2.0

import { IsBoolean, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFamilySettingsDto {
  @ApiPropertyOptional({ description: '家庭名称', example: '小明的家' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ description: '孩子创建任务是否需要家长审批' })
  @IsBoolean()
  @IsOptional()
  approvalMode?: boolean;

  @ApiPropertyOptional({ description: '孩子端可用开始时间', example: '08:00' })
  @IsString()
  @IsOptional()
  useTimeStart?: string;

  @ApiPropertyOptional({ description: '孩子端可用结束时间', example: '21:00' })
  @IsString()
  @IsOptional()
  useTimeEnd?: string;

  @ApiPropertyOptional({ description: '家庭状态：停用不删除数据', enum: ['active', 'inactive'] })
  @IsString()
  @IsOptional()
  @IsIn(['active', 'inactive'])
  status?: string;
}
