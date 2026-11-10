// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BadgesService } from './badges.service';
import { CreateBadgeDto } from './dto/create-badge.dto';
import { UpdateBadgeDto } from './dto/update-badge.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('徽章')
@ApiBearerAuth()
@FeatureFlag('badges')
@Controller({ path: 'badges', version: '1' })
export class BadgesController {
  constructor(private readonly badgesService: BadgesService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量徽章列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.badgesService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意徽章' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.badgesService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建徽章' })
  async create(@Body() dto: CreateBadgeDto, @CurrentUser() user: JwtPayload) {
    return this.badgesService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: '获取我的徽章列表' })
  async findAll(@CurrentUser() user: JwtPayload, @Query('q') q?: string) {
    return this.badgesService.findAll(user.sub, q);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新徽章' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBadgeDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.badgesService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除徽章' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.badgesService.remove(id, ability);
    return null;
  }
}
