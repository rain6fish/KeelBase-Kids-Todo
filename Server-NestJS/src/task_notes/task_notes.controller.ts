// SPDX-License-Identifier: Apache-2.0

import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus, ParseIntPipe, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TaskNotesService } from './task_notes.service';
import { CreateTaskNoteDto } from './dto/create-task_note.dto';
import { UpdateTaskNoteDto } from './dto/update-task_note.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { CurrentAbility } from '../common/casl/current-ability.decorator';
import { CheckPolicies } from '../common/casl/check-policies.decorator';
import { FeatureFlag } from '../feature-flags/feature-flag.decorator';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@ApiTags('任务备注')
@ApiBearerAuth()
@FeatureFlag('task_notes')
@Controller({ path: 'task_notes', version: '1' })
export class TaskNotesController {
  constructor(private readonly task_notesService: TaskNotesService) {}

  // 管理端：全量列表（admin，供 Web-Admin-Vue 管理页）
  @Get('admin/all')
  @ApiOperation({ summary: '管理端：全量任务备注列表' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async findAllForAdmin() {
    return this.task_notesService.findAllForAdmin();
  }

  // 管理端：删除任意（admin，软删进回收站）
  @Delete('admin/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '管理端：删除任意任务备注' })
  @CheckPolicies((ability) => ability.can('manage', 'all'))
  async removeAsAdmin(@Param('id', ParseIntPipe) id: number) {
    await this.task_notesService.removeAsAdmin(id);
    return null;
  }

  @Post()
  @ApiOperation({ summary: '创建任务备注' })
  async create(@Body() dto: CreateTaskNoteDto, @CurrentUser() user: JwtPayload) {
    return this.task_notesService.create(dto, user);
  }

  @Get('unread')
  @ApiOperation({ summary: '每个任务的新备注未读数与未读变更数' })
  async unread(@CurrentUser() user: JwtPayload) {
    return this.task_notesService.unreadCounts(user);
  }

  @Post('read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '把某个任务的备注标记为已读' })
  async markRead(
    @CurrentUser() user: JwtPayload,
    @Body() body: { taskId?: number },
  ) {
    if (body?.taskId) {
      await this.task_notesService.markRead(user, body.taskId);
    }
    return { ok: true };
  }

  @Get()
  @ApiOperation({ summary: '获取任务备注列表（可按任务过滤）' })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('q') q?: string,
    @Query('taskIdId') taskIdId?: string,
  ) {
    return this.task_notesService.findAll(user, q, {
      taskIdId: taskIdId ? Number(taskIdId) : undefined,
    });
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新任务备注' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTaskNoteDto,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    return this.task_notesService.update(id, dto, ability);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '删除任务备注' })
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: JwtPayload,
    @CurrentAbility() ability: AppAbility,
  ) {
    await this.task_notesService.remove(id, ability);
    return null;
  }
}
