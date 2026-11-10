// SPDX-License-Identifier: Apache-2.0

import {
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SyncChangeDto {
  @ApiProperty({ description: '实体类型（当前支持 task）', example: 'task' })
  @IsString()
  @IsIn(['task'])
  entityType!: string;

  @ApiProperty({
    description: '动作：complete 用于离线完成任务（无需客户端提供版本号）',
    enum: ['insert', 'update', 'delete', 'complete'],
  })
  @IsString()
  @IsIn(['insert', 'update', 'delete', 'complete'])
  action!: string;

  @ApiPropertyOptional({ description: '实体 ID（update/delete 必填）' })
  @IsInt()
  @IsOptional()
  entityId?: number;

  @ApiPropertyOptional({ description: '实体数据（insert/update 必填）' })
  @IsObject()
  @IsOptional()
  payload?: Record<string, unknown>;

  @ApiPropertyOptional({ description: '客户端读到的版本号（乐观锁）' })
  @IsInt()
  @IsOptional()
  baseVersion?: number;
}

export class PushChangesDto {
  @ApiProperty({ description: '设备唯一标识' })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({ description: '待同步的本地变更', type: [SyncChangeDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncChangeDto)
  changes!: SyncChangeDto[];
}
