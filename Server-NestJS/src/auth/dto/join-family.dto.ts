// SPDX-License-Identifier: Apache-2.0

import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinFamilyDto {
  @ApiProperty({ description: '家庭邀请码', example: 'ABCD2345' })
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;
}
