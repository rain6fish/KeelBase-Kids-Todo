// SPDX-License-Identifier: Apache-2.0

import { Injectable, Optional, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { subject } from '@casl/ability';
import { TaskNote } from './task_note.entity';
import { TaskNoteRead } from './task-note-read.entity';
import { Task } from '../tasks/task.entity';
import { ChangeSequence } from '../sync/change-sequence.entity';
import { CreateTaskNoteDto } from './dto/create-task_note.dto';
import { UpdateTaskNoteDto } from './dto/update-task_note.dto';
import type { AppAbility } from '../common/casl/casl-ability.factory';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FamilyScopeService } from '../common/services/family-scope.service';
import { ChangeLogService } from '../common/change-log/change-log.service';

/** 列表 `?q=` 匹配的列（spec 的 string / text 字段，按声明顺序）。 */
const TASK_NOTE_SEARCH_COLUMNS = ['content', 'mediaUrl'];

@Injectable()
export class TaskNotesService {
  constructor(
    @InjectRepository(TaskNote)
    private readonly task_notesRepository: Repository<TaskNote>,
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @Optional() @InjectRepository(TaskNoteRead)
    private readonly reads?: Repository<TaskNoteRead>,
    @Optional() @InjectRepository(ChangeSequence)
    private readonly changes?: Repository<ChangeSequence>,
    @Optional() private readonly familyScope?: FamilyScopeService,
    @Optional() private readonly changeLog?: ChangeLogService,
  ) {}

  private async logChange(action: 'insert' | 'update' | 'delete', note: TaskNote): Promise<void> {
    await this.changeLog?.record({
      entityType: 'task_note',
      entityId: note.id,
      action,
      payload: note,
      familyId: note.familyId,
      userId: note.userId,
    });
  }

  private async resolveActor(actor: JwtPayload | number) {
    if (typeof actor !== 'number') return { userId: actor.sub, familyId: actor.familyId };
    const scope = await this.familyScope?.resolve(actor);
    return { userId: actor, familyId: scope?.familyId };
  }

  /**
   * Ref validation: every foreign key must point at a row that exists.
   * A soft-deleted target counts as missing — TypeORM's find excludes those by default.
   *
   * 关联校验：每个外键都必须指向确实存在的行。软删的目标视为不存在 —— TypeORM 的
   * find 默认就把它们排除在外。
   */
  private async _assertRefs(dto: {
    taskIdId?: number | null;
  }): Promise<void> {
    if (dto.taskIdId != null) {
      const found = await this.tasksRepository.findOne({ where: { id: dto.taskIdId } });
      if (!found) throw new BadRequestException('taskIdId 指向的记录不存在');
    }
  }


  async create(dto: CreateTaskNoteDto, actor: JwtPayload | number): Promise<TaskNote> {
    const { userId, familyId } = await this.resolveActor(actor);
    await this._assertRefs(dto);
    const entity = this.task_notesRepository.create({
      ...dto,
      userId,
      familyId,
    });
    const saved = await this.task_notesRepository.save(entity);
    await this.logChange('insert', saved);
    return saved;
  }

  /** 每个任务里「别人发的、我还没读的」备注数 + 别人对该任务的未读变更数 */
  async unreadCounts(actor: JwtPayload | number) {
    if (!this.reads) return { counts: {}, total: 0, changes: {} };
    const { userId, familyId } = await this.resolveActor(actor);
    const scope = familyId != null ? { familyId } : { userId };
    const notes = await this.task_notesRepository.find({
      where: scope,
      select: { id: true, taskIdId: true, userId: true },
    });
    const readRows = await this.reads.find({ where: { userId } });
    const lastReadByTask = new Map<number, number>();
    for (const row of readRows) lastReadByTask.set(row.taskId, row.lastReadNoteId);

    const counts: Record<number, number> = {};
    let total = 0;
    for (const note of notes) {
      if (note.userId === userId || note.taskIdId == null) continue;
      const lastRead = lastReadByTask.get(note.taskIdId) ?? 0;
      if (note.id > lastRead) {
        counts[note.taskIdId] = (counts[note.taskIdId] ?? 0) + 1;
        total += 1;
      }
    }
    return { counts, total, changes: await this.unreadTaskChanges(userId, familyId) };
  }

  /**
   * 每个任务「别人改过、我还没看过」的变更条数。
   * 变更流水按 family 存；已读位置存在 task_note_reads.last_read_change_id（打开详情时推进）。
   * 自己做的变更不算未读 —— 用户知道自己刚改了什么。
   */
  private async unreadTaskChanges(
    userId: number,
    familyId?: number,
  ): Promise<Record<number, number>> {
    if (!this.changes || familyId == null) return {};
    const rows = await this.changes
      .createQueryBuilder('c')
      .leftJoin(
        TaskNoteRead,
        'r',
        'r.task_id = c.entity_id AND r.user_id = :userId',
        { userId },
      )
      .select('c.entity_id', 'taskId')
      .addSelect('COUNT(*)', 'cnt')
      .where('c.entity_type = :type', { type: 'task' })
      .andWhere('c.family_id = :familyId', { familyId })
      .andWhere('(c.user_id IS NULL OR c.user_id != :userId)', { userId })
      .andWhere('c.id > COALESCE(r.last_read_change_id, 0)')
      .groupBy('c.entity_id')
      .getRawMany<{ taskId: number; cnt: string }>();
    const changes: Record<number, number> = {};
    for (const row of rows) {
      const taskId = Number(row.taskId);
      const count = Number(row.cnt);
      if (taskId > 0 && count > 0) changes[taskId] = count;
    }
    return changes;
  }

  /** 打开任务详情时，把该任务的备注和变更流水标记为已读 */
  async markRead(actor: JwtPayload | number, taskId: number): Promise<void> {
    if (!this.reads) return;
    const { userId, familyId } = await this.resolveActor(actor);
    const scope = familyId != null ? { familyId } : { userId };
    const latest = await this.task_notesRepository.findOne({
      where: { ...scope, taskIdId: taskId },
      order: { id: 'DESC' },
    });
    const maxId = latest?.id ?? 0;
    const latestChange = await this.changes?.findOne({
      where: { entityType: 'task', entityId: taskId },
      order: { id: 'DESC' },
    });
    const maxChangeId = latestChange?.id ?? 0;
    const existing = await this.reads.findOne({ where: { userId, taskId } });
    if (existing) {
      let dirty = false;
      if (maxId > existing.lastReadNoteId) {
        existing.lastReadNoteId = maxId;
        dirty = true;
      }
      if (maxChangeId > existing.lastReadChangeId) {
        existing.lastReadChangeId = maxChangeId;
        dirty = true;
      }
      if (dirty) await this.reads.save(existing);
      return;
    }
    await this.reads.save(
      this.reads.create({
        userId,
        taskId,
        lastReadNoteId: maxId,
        lastReadChangeId: maxChangeId,
      }),
    );
  }

  async findAll(
    actor: JwtPayload | number,
    q?: string,
    filters: { taskIdId?: number } = {},
  ): Promise<TaskNote[]> {
    const { userId, familyId } = await this.resolveActor(actor);
    const scope: Record<string, unknown> = familyId != null ? { familyId } : { userId };
    if (filters.taskIdId != null) scope.taskIdId = filters.taskIdId;
    const keyword = q?.trim();
    // Every arm carries the ownership condition, so a hit on any column still stays the caller's
    // own rows.
    // 每条分支各自带归属条件，故任何一列命中都仍限在调用方自己的行内。
    const where = keyword
      ? TASK_NOTE_SEARCH_COLUMNS.map((column) => ({ ...scope, [column]: Like(`%${keyword}%`) }))
      : scope;
    return this.task_notesRepository.find({
      where,
      relations: { taskId: true },
      order: { createdAt: 'ASC' },
    });
  }

  /** 管理端：全量列表（无 userId 过滤，admin） */
  async findAllForAdmin(): Promise<TaskNote[]> {
    return this.task_notesRepository.find({ relations: { taskId: true }, order: { createdAt: 'DESC' } });
  }

  /** 管理端：删除任意（软删进回收站，admin） */
  async removeAsAdmin(id: number): Promise<void> {
    await this.task_notesRepository.softDelete(id);
  }

  async findOne(id: number, ability: AppAbility): Promise<TaskNote> {
    const entity = await this.task_notesRepository.findOne({ where: { id }, relations: { taskId: true }, });
    if (!entity) throw new NotFoundException('TaskNote not found');
    if (ability.cannot('read', subject('TaskNote', entity))) {
      throw new ForbiddenException('无权访问此任务备注');
    }
    return entity;
  }

  async update(id: number, dto: UpdateTaskNoteDto, ability: AppAbility): Promise<TaskNote> {
    await this._assertRefs(dto);
    const entity = await this.findOne(id, ability);
    const { version, ...fields } = dto;
    // The conditional update is the **only** arbiter: the row is written only while it is still at
    // the version the caller read, so two writers cannot both succeed.
    //
    // Note what is deliberately *not* used: save(). A version column bumps on write but does not
    // guard the write — checked against the SQL the driver actually emits, the UPDATE carries no
    // version predicate — so a stale save silently overwrites. Zero rows affected is the conflict.
    //
    // 条件更新是**唯一**仲裁点：只有当行仍停在调用方读到的那个版本时才写入，故两个写入者不可能都成功。
    //
    // 这里刻意**不用** save()：版本列会在写入时自增，却不为写入设防 —— 按驱动实发的 SQL 核过，
    // 那条 UPDATE 里没有版本判据 —— 于是一次陈旧的保存就是无声覆盖。「影响 0 行」即冲突。
    const result = await this.task_notesRepository.update(
      { id: entity.id, version },
      { ...fields, version: () => 'version + 1' },
    );
    if (!result.affected) {
      throw new ConflictException('该记录已被他人修改，请刷新后重试');
    }
    const updated = await this.findOne(id, ability);
    await this.logChange('update', updated);
    return updated;
  }

  async remove(id: number, ability: AppAbility): Promise<void> {
    const entity = await this.findOne(id, ability);
    // RG-3 软删除：置 deleted_at，管理台回收站可恢复
    await this.task_notesRepository.softDelete(entity.id);
    await this.logChange('delete', entity);
  }
}
