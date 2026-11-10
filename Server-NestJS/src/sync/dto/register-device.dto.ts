// SPDX-License-Identifier: Apache-2.0

import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDeviceDto {
  @ApiProperty({ description: '设备唯一标识', example: 'flutter-android-abc123' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  deviceId!: string;

  @ApiPropertyOptional({ description: '设备名称', example: '小明的平板' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  deviceName?: string;

  @ApiPropertyOptional({ description: '平台', enum: ['ios', 'android', 'web'] })
  @IsString()
  @IsOptional()
  @IsIn(['ios', 'android', 'web'])
  platform?: string;
}
