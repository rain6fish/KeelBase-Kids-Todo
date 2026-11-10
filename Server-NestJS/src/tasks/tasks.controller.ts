// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';
import { ChangeLogService } from '../common/change-log/change-log.service';

@ApiTags('任务')
@ApiBearerAuth()
@FeatureFlag('tasks')
@Controller({ path: 'tasks', version: '1' })
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private readonly changeLog: ChangeLogService,
  ) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量任务列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.tasksService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意任务' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.tasksService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建任务' })
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: JwtPayload) {
    return this.tasksService.create(dto, user);
  }

  @Get()
  @ApiOperation({ summary: '获取家庭任务列表（可按状态/日期/执行人过滤）' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('q') q?: string,
    @Query('status') status?: string,
    @Query('date') date?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.tasksService.findAll(user, q, {
      status,
      date,
      assigneeId: assigneeId ? Number(assigneeId) : undefined,
    });
  }

  @Patch(':id/complete')
  @ApiOperation({ summary: '完成任务（同时结算积分与打卡）' })
  async complete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.tasksService.complete(id, user, ability);
  }

  @Patch(':id/uncomplete')
  @ApiOperation({ summary: '撤销完成（状态回到 todo，回退积分与打卡）' })
  async uncomplete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.tasksService.uncomplete(id, user, ability);
  }

  @Patch(':id/approve')
  @ApiOperation({ summary: '家长审批通过孩子的任务' })
  async approve(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.tasksService.approve(id, user, ability);
  }

  @Patch(':id/reject')
  @ApiOperation({ summary: '家长驳回孩子的任务' })
  async reject(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.tasksService.reject(id, user, ability);
  }

  @Patch(':id/help')
  @ApiOperation({ summary: '孩子请求帮助' })
  async requestHelp(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { note?: string },
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.tasksService.requestHelp(id, body?.note, ability, user);
  }

  @Get(':id/history')
  @ApiOperation({ summary: '任务操作历史（不可删除）' })
  async history(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.changeLog.listForEntity(
      { familyId: user.familyId, userId: user.sub },
      'task',
      id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '任务详情' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.tasksService.findOne(id, ability);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新任务' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.tasksService.update(id, dto, ability, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除任务' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.tasksService.remove(id, ability, user);
    return null;
  }
}
