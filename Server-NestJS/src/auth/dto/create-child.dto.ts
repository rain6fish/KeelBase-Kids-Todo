// SPDX-License-Identifier: Apache-2.0

import { IsString, IsNotEmpty, MinLength, MaxLength, Matches, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateChildDto {
  @ApiProperty({ description: '孩子昵称（家庭内唯一）', example: '小明' })
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(30)
  nickname!: string;

  @ApiProperty({ description: '4-6 位数字 PIN', example: '1234' })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN 必须是 4-6 位数字' })
  pin!: string;

  @ApiPropertyOptional({ description: '登录账号（可选；不填自动生成）', example: 'xiaoming' })
  @IsString()
  @IsOptional()
  @Matches(/^[a-zA-Z0-9_]{3,32}$/, {
    message: '登录账号只能包含字母、数字和下划线，3-32 位',
  })
  username?: string;

  @ApiPropertyOptional({ description: '成员标识色', example: '#4A90D9' })
  @IsString()
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: '颜色必须是 #RRGGBB 格式' })
  colorTag?: string;
}
