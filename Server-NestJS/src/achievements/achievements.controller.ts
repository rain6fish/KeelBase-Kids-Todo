// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AchievementsService } from './achievements.service';
import { CreateAchievementDto } from './dto/create-achievement.dto';
import { UpdateAchievementDto } from './dto/update-achievement.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('成就')
@ApiBearerAuth()
@FeatureFlag('achievements')
@Controller({ path: 'achievements', version: '1' })
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量成就列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.achievementsService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意成就' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.achievementsService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建成就' })
  async create(@Body() dto: CreateAchievementDto, @CurrentUser() user: JwtPayload) {
    return this.achievementsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: '获取我的成就列表' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.achievementsService.findAll(user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新成就' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAchievementDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.achievementsService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除成就' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.achievementsService.remove(id, ability);
    return null;
  }
}
