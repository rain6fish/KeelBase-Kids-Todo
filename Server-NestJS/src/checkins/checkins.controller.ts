// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CheckinsService } from './checkins.service';
import { CreateCheckinDto } from './dto/create-checkin.dto';
import { UpdateCheckinDto } from './dto/update-checkin.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('打卡')
@ApiBearerAuth()
@FeatureFlag('checkins')
@Controller({ path: 'checkins', version: '1' })
export class CheckinsController {
  constructor(private readonly checkinsService: CheckinsService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量打卡列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.checkinsService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意打卡' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.checkinsService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建打卡' })
  async create(@Body() dto: CreateCheckinDto, @CurrentUser() user: JwtPayload) {
    return this.checkinsService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: '获取我的打卡列表' })
  async findAll(@CurrentUser() user: JwtPayload) {
    return this.checkinsService.findAll(user.sub);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新打卡' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCheckinDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.checkinsService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除打卡' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.checkinsService.remove(id, ability);
    return null;
  }
}
