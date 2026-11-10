// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DailyReviewsService } from './daily_reviews.service';
import { CreateDailyReviewDto } from './dto/create-daily_review.dto';
import { UpdateDailyReviewDto } from './dto/update-daily_review.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('每日评价')
@ApiBearerAuth()
@FeatureFlag('daily_reviews')
@Controller({ path: 'daily_reviews', version: '1' })
export class DailyReviewsController {
  constructor(private readonly daily_reviewsService: DailyReviewsService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量每日评价列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.daily_reviewsService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意每日评价' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.daily_reviewsService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建每日评价' })
  async create(@Body() dto: CreateDailyReviewDto, @CurrentUser() user: JwtPayload) {
    return this.daily_reviewsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取我的每日评价列表' })
  async findAll(@CurrentUser() user: JwtPayload, @Query('q') q?: string) {
    return this.daily_reviewsService.findAll(user, q);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新每日评价' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDailyReviewDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.daily_reviewsService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除每日评价' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.daily_reviewsService.remove(id, ability);
    return null;
  }
}
