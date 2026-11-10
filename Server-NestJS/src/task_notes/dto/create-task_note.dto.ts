// SPDX-License-Identifier: Apache-2.0

import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTaskNoteDto {
  @ApiProperty({ description: 'taskId' })
  @IsInt()
  @IsNotEmpty()
  taskIdId!: number;

  @ApiProperty({ description: 'content' })
  @IsString()
  @IsNotEmpty()
  content!: string;

  @ApiProperty({ description: 'contentType', enum: ['text', 'voice', 'image', 'file'] })
  @IsString()
  @IsNotEmpty()
  @IsIn(['text', 'voice', 'image', 'file'])
  contentType!: string;

  @ApiPropertyOptional({ description: '媒体地址（语音/图片备注时才有）' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  mediaUrl?: string;
}
