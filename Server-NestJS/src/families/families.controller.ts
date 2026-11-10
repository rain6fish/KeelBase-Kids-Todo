// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FamiliesService } from './families.service';
import { CreateFamilieDto } from './dto/create-familie.dto';
import { UpdateFamilieDto } from './dto/update-familie.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('家庭')
@ApiBearerAuth()
@FeatureFlag('families')
@Controller({ path: 'families', version: '1' })
export class FamiliesController {
  constructor(private readonly familiesService: FamiliesService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量家庭列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.familiesService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意家庭' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.familiesService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建家庭' })
  async create(@Body() dto: CreateFamilieDto, @CurrentUser() user: JwtPayload) {
    return this.familiesService.create(dto, user.sub);
  }

  @Get()
  @ApiOperation({ summary: '获取我的家庭列表' })
  async findAll(@CurrentUser() user: JwtPayload, @Query('q') q?: string) {
    return this.familiesService.findAll(user, q);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新家庭' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateFamilieDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.familiesService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除家庭' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.familiesService.remove(id, ability);
    return null;
  }
}
