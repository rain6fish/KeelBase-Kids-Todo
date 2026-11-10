// SPDX-License-Identifier: Apache-2.0

import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChildLoginDto {
  @ApiPropertyOptional({
    description: '家庭邀请码（选填；不填则按登录账号匹配）',
    example: 'ABCD2345',
  })
  @IsString()
  @IsOptional()
  inviteCode?: string;

  @ApiProperty({ description: '孩子登录账号', example: 'xiaoming' })
  @IsString()
  @IsNotEmpty()
  username!: string;

  @ApiProperty({ description: '4-6 位数字 PIN', example: '1234' })
  @IsString()
  @Matches(/^\d{4,6}$/, { message: 'PIN 必须是 4-6 位数字' })
  pin!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9-]{1,64}$/)
  @IsNotEmpty()
  deviceId!: string;
}
