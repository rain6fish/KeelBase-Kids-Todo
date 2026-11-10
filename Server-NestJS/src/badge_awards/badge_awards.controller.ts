// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BadgeAwardsService } from './badge_awards.service';
import { CreateBadgeAwardDto } from './dto/create-badge_award.dto';
import { UpdateBadgeAwardDto } from './dto/update-badge_award.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('徽章授予')
@ApiBearerAuth()
@FeatureFlag('badge_awards')
@Controller({ path: 'badge_awards', version: '1' })
export class BadgeAwardsController {
  constructor(private readonly badge_awardsService: BadgeAwardsService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量徽章授予列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.badge_awardsService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意徽章授予' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.badge_awardsService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建徽章授予' })
  async create(@Body() dto: CreateBadgeAwardDto, @CurrentUser() user: JwtPayload) {
    return this.badge_awardsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: '获取我的徽章授予列表' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.badge_awardsService.findAll(user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新徽章授予' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBadgeAwardDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.badge_awardsService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除徽章授予' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.badge_awardsService.remove(id, ability);
    return null;
  }
}
