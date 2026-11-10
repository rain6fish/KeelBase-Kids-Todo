// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RewardsService } from './rewards.service';
import { CreateRewardDto } from './dto/create-reward.dto';
import { UpdateRewardDto } from './dto/update-reward.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('奖励')
@ApiBearerAuth()
@FeatureFlag('rewards')
@Controller({ path: 'rewards', version: '1' })
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量奖励列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.rewardsService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意奖励' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.rewardsService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建奖励' })
  async create(@Body() dto: CreateRewardDto, @CurrentUser() user: JwtPayload) {
    return this.rewardsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取我的奖励列表' })
  async findAll(@CurrentUser() user: JwtPayload, @Query('q') q?: string) {
    return this.rewardsService.findAll(user, q);
  }

  @Get('redemptions')
  @ApiOperation({ summary: '家庭兑换记录' })
  async listRedemptions(@CurrentUser() user: JwtPayload) {
    return this.rewardsService.listRedemptions(user);
  }

  @Patch('redemptions/:id/cancel')
  @ApiOperation({ summary: '取消兑换并退回积分' })
  async cancelRedemption(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.rewardsService.cancelRedemption(id, user);
  }

  @Post(':id/redeem')
  @ApiOperation({ summary: '兑换奖励（扣减积分）' })
  async redeem(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.rewardsService.redeem(id, user, ability);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新奖励' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRewardDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.rewardsService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除奖励' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.rewardsService.remove(id, ability);
    return null;
  }
}
