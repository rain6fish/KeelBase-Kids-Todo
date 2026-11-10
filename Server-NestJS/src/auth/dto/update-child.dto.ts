// SPDX-License-Identifier: Apache-2.0

import { IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateChildDto {
  @ApiPropertyOptional({ description: '登录账号', example: 'xiaoming' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{3,32}$/, {
    message: '登录账号只能包含字母、数字和下划线，3-32 位',
  })
  username?: string;

  @ApiPropertyOptional({ description: '孩子昵称（家庭内唯一）', example: '小明' })
  @IsString()
  @IsOptional()
  @MinLength(1)
  @MaxLength(30)
  nickname?: string;

  @ApiPropertyOptional({ description: '4-6 位数字 PIN（不填则不修改）', example: '1234' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{4,6}$/, { message: 'PIN 必须是 4-6 位数字' })
  pin?: string;
}
