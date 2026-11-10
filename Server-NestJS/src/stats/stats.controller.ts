// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { StatsService } from './stats.service';

@ApiTags('家庭统计')
@ApiBearerAuth()
@Controller({ path: 'stats', version: '1' })
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('overview')
  @ApiOperation({ summary: '今日任务总览（完成率/成员数/家庭积分；?date=YYYY-MM-DD 指定本地日期）' })
  async overview(@CurrentUser() user: JwtPayload, @Query('date') date?: string) {
    return this.statsService.overview(user, date);
  }

  @Get('completion-rate')
  @ApiOperation({ summary: '最近 N 天每日完成率（默认 7 天，最多 30 天）' })
  async completionRate(@CurrentUser() user: JwtPayload, @Query('days') days?: string) {
    return this.statsService.completionRate(user, days ? Number(days) : 7);
  }

  @Get('child-created-ratio')
  @ApiOperation({ summary: '孩子创建任务占全部任务的比例' })
  async childCreatedRatio(@CurrentUser() user: JwtPayload) {
    return this.statsService.childCreatedRatio(user);
  }

  @Get('streak')
  @ApiOperation({ summary: '本人积分、连签与最近打卡记录' })
  async streak(@CurrentUser() user: JwtPayload) {
    return this.statsService.streak(user);
  }
}
