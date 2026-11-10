// SPDX-License-Identifier: Apache-2.0

import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AckDto {
  @ApiProperty({ description: '设备唯一标识' })
  @IsString()
  @IsNotEmpty()
  deviceId!: string;

  @ApiProperty({ description: '已处理的最后变更序号' })
  @IsInt()
  @Min(0)
  seq!: number;
}
