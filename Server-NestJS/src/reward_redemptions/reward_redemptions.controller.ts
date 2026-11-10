// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RewardRedemptionsService } from './reward_redemptions.service';
import { CreateRewardRedemptionDto } from './dto/create-reward_redemption.dto';
import { UpdateRewardRedemptionDto } from './dto/update-reward_redemption.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('兑换记录')
@ApiBearerAuth()
@FeatureFlag('reward_redemptions')
@Controller({ path: 'reward_redemptions', version: '1' })
export class RewardRedemptionsController {
  constructor(private readonly reward_redemptionsService: RewardRedemptionsService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量兑换记录列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.reward_redemptionsService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意兑换记录' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.reward_redemptionsService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建兑换记录' })
  async create(@Body() dto: CreateRewardRedemptionDto, @CurrentUser() user: JwtPayload) {
    return this.reward_redemptionsService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取我的兑换记录列表' })
  async findAll(@CurrentUser() user: JwtPayload, @Query('q') q?: string) {
    return this.reward_redemptionsService.findAll(user, q);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新兑换记录' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateRewardRedemptionDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.reward_redemptionsService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除兑换记录' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.reward_redemptionsService.remove(id, ability);
    return null;
  }
}
