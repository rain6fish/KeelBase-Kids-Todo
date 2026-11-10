// SPDX-License-Identifier: Apache-2.0

import { Injectable, Optional, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Like, Repository } from 'typeorm';
import { subject } from '@casl/ability';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import type { AppAbility } from '../common/casl/casl-ability.factory';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FamilyScopeService } from '../common/services/family-scope.service';
import { FamiliesService } from '../families/families.service';
import { TaskProgressService } from './task-progress.service';
import { ChangeLogService } from '../common/change-log/change-log.service';

/** 列表 `?q=` 匹配的列（spec 的 string / text 字段，按声明顺序）。 */
const TASK_SEARCH_COLUMNS = ['title', 'description', 'helpRequestNote'];

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly tasksRepository: Repository<Task>,
    @Optional() private readonly familyScope?: FamilyScopeService,
    @Optional() private readonly familiesService?: FamiliesService,
    @Optional() private readonly progress?: TaskProgressService,
    @Optional() private readonly changeLog?: ChangeLogService,
  ) {}

  private async logChange(
    action: 'insert' | 'update' | 'delete',
    task: Task,
    actorId?: number,
  ): Promise<void> {
    await this.changeLog?.record({
      entityType: 'task',
      entityId: task.id,
      action,
      payload: task,
      familyId: task.familyId,
      userId: actorId ?? task.userId,
    });
  }

  private actorIdOf(actor?: JwtPayload | number): number | undefined {
    if (actor == null) return undefined;
    return typeof actor === 'number' ? actor : actor.sub;
  }

  private async resolveActor(actor: JwtPayload | number) {
    if (typeof actor !== 'number') return { userId: actor.sub, familyId: actor.familyId, role: actor.familyRole };
    const scope = await this.familyScope?.resolve(actor);
    return { userId: actor, familyId: scope?.familyId, role: undefined };
  }

  async create(dto: CreateTaskDto, actor: JwtPayload | number): Promise<Task> {
    const { userId, familyId, role } = await this.resolveActor(actor);
    let approvalStatus = dto.approvalStatus;
    // 孩子创建的任务是否要家长审批，由家庭设置决定
    if (role === 'child' && familyId && this.familiesService) {
      const family = await this.familiesService.findOneRaw(familyId);
      approvalStatus = family.approvalMode ? 'pending' : 'none';
    }
    const entity = this.tasksRepository.create({
      ...dto,
      userId,
      familyId,
      approvalStatus,
      // 孩子创建的任务默认指派给自己——否则完成后没有 assignee，积分/打卡不会结算
      assigneeId: dto.assigneeId ?? (role === 'child' ? userId : undefined),
    });
    const saved = await this.tasksRepository.save(entity);
    await this.logChange('insert', saved, userId);
    return saved;
  }

  async findAll(
    actor: JwtPayload | number,
    q?: string,
    filters: { status?: string; date?: string; assigneeId?: number } = {},
  ): Promise<Task[]> {
    const { userId, familyId } = await this.resolveActor(actor);
    const keyword = q?.trim();
    const base: Record<string, unknown> = familyId ? { familyId } : { userId };
    if (filters.status) base.status = filters.status;
    // 按日期区间取当天，而不是 `LIKE 'YYYY-MM-DD%'`：taskDate 是 timestamp，
    // Postgres 没有 timestamp ~~ text 操作符（生产会 500），区间在 sqlite/postgres 都成立。
    if (filters.date && /^\d{4}-\d{2}-\d{2}$/.test(filters.date)) {
      base.taskDate = Between(
        new Date(`${filters.date}T00:00:00.000Z`),
        new Date(`${filters.date}T23:59:59.999Z`),
      );
    }
    if (filters.assigneeId) base.assigneeId = filters.assigneeId;
    // Every arm carries the ownership condition, so a hit on any column still stays the caller's
    // own rows.
    // 每条分支各自带归属条件，故任何一列命中都仍限在调用方自己的行内。
    const where = keyword
      ? TASK_SEARCH_COLUMNS.map((column) => ({ ...base, [column]: Like(`%${keyword}%`) }))
      : base;
    return this.tasksRepository.find({
      where,
      order: { taskDate: 'DESC', sortOrder: 'ASC', createdAt: 'DESC' },
    });
  }

  /** 管理端：全量列表（无 userId 过滤，admin） */
  async findAllForAdmin(): Promise<Task[]> {
    return this.tasksRepository.find({ order: { createdAt: 'DESC' } });
  }

  /** 管理端：删除任意（软删进回收站，admin） */
  async removeAsAdmin(id: number): Promise<void> {
    await this.tasksRepository.softDelete(id);
  }

  async findOne(id: number, ability: AppAbility): Promise<Task> {
    const entity = await this.tasksRepository.findOne({ where: { id }, });
    if (!entity) throw new NotFoundException('Task not found');
    if (ability.cannot('read', subject('Task', entity))) {
      throw new ForbiddenException('无权访问此任务');
    }
    return entity;
  }

  /**
   * 家庭内任务归属：孩子只能改自己创建的任务（userId 即创建者），家长可改家庭内任何任务。
   * 家庭的边界已由 CASL 的 familyId 规则把关，这里只收紧孩子这一档。
   *
   * A child may only modify tasks they created; a parent may modify any task in the family.
   * Family scope itself is already enforced by the CASL familyId rule.
   */
  private assertCanModify(task: Task, actor: JwtPayload | number): void {
    if (typeof actor === 'number') return;
    if (actor.familyRole === 'child' && task.userId !== actor.sub) {
      throw new ForbiddenException('孩子只能修改自己创建的任务');
    }
  }

  async update(
    id: number,
    dto: UpdateTaskDto,
    ability: AppAbility,
    actor: JwtPayload | number,
  ): Promise<Task> {
    const entity = await this.findOne(id, ability);
    this.assertCanModify(entity, actor);
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
    const result = await this.tasksRepository.update(
      { id: entity.id, version },
      { ...fields, version: () => 'version + 1' },
    );
    if (!result.affected) {
      throw new ConflictException('该记录已被他人修改，请刷新后重试');
    }
    const updated = await this.findOne(id, ability);
    await this.logChange('update', updated, this.actorIdOf(actor));
    return updated;
  }

  async complete(id: number, actor: JwtPayload | number, ability: AppAbility): Promise<Task> {
    const task = await this.findOne(id, ability);
    if (task.status === 'done') return task;
    await this.tasksRepository.update({ id }, { status: 'done', completedAt: new Date() });
    const updated = await this.tasksRepository.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Task not found');
    await this.progress?.onCompleted(updated);
    if (updated.repeatRule && updated.repeatRule !== 'none') {
      await this.createNextOccurrence(updated, this.actorIdOf(actor));
    }
    await this.logChange('update', updated, this.actorIdOf(actor));
    return updated;
  }

  /** 撤销完成（complete 是单向的）：状态回到 todo，并回退积分/打卡结算 */
  async uncomplete(id: number, actor: JwtPayload | number, ability: AppAbility): Promise<Task> {
    const task = await this.findOne(id, ability);
    this.assertCanModify(task, actor);
    if (task.status !== 'done') return task;
    await this.tasksRepository.update({ id }, { status: 'todo', completedAt: null });
    const updated = await this.tasksRepository.findOne({ where: { id } });
    if (!updated) throw new NotFoundException('Task not found');
    await this.progress?.onUncompleted(updated);
    await this.logChange('update', updated, this.actorIdOf(actor));
    return updated;
  }

  async approve(id: number, actor: JwtPayload, ability: AppAbility): Promise<Task> {
    this.assertParent(actor);
    await this.findOne(id, ability);
    await this.tasksRepository.update(
      { id },
      { approvalStatus: 'approved', approvedBy: actor.sub, approvedAt: new Date() },
    );
    const updated = await this.findOne(id, ability);
    await this.logChange('update', updated, actor.sub);
    return updated;
  }

  async reject(id: number, actor: JwtPayload, ability: AppAbility): Promise<Task> {
    this.assertParent(actor);
    await this.findOne(id, ability);
    await this.tasksRepository.update(
      { id },
      { approvalStatus: 'rejected', approvedBy: actor.sub, approvedAt: new Date() },
    );
    const updated = await this.findOne(id, ability);
    await this.logChange('update', updated, actor.sub);
    return updated;
  }

  async requestHelp(
    id: number,
    note: string | undefined,
    ability: AppAbility,
    actor?: JwtPayload | number,
  ): Promise<Task> {
    await this.findOne(id, ability);
    await this.tasksRepository.update(
      { id },
      { helpRequested: true, helpRequestNote: note ?? null },
    );
    const updated = await this.findOne(id, ability);
    await this.logChange('update', updated, this.actorIdOf(actor));
    return updated;
  }

  private assertParent(actor: JwtPayload): void {
    if (actor.familyRole !== 'parent') {
      throw new ForbiddenException('仅家长可审批任务');
    }
  }

  /** 完成重复任务时，按规则生成下一次实例（不继承审批/完成状态） */
  private async createNextOccurrence(task: Task, actorId?: number): Promise<void> {
    const days = task.repeatRule === 'daily' ? 1 : task.repeatRule === 'weekly' ? 7 : 30;
    const nextDate = new Date(task.taskDate);
    nextDate.setDate(nextDate.getDate() + days);
    const next = this.tasksRepository.create({
      userId: task.userId,
      familyId: task.familyId,
      assigneeId: task.assigneeId,
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: 'todo',
      taskDate: nextDate,
      estimatedMinutes: task.estimatedMinutes,
      repeatRule: task.repeatRule,
      approvalStatus: 'none',
      helpRequested: false,
      sortOrder: task.sortOrder,
      repeatGroupId: task.repeatGroupId ?? task.id,
    });
    const saved = await this.tasksRepository.save(next);
    await this.logChange('insert', saved, actorId);
  }

  async remove(
    id: number,
    ability: AppAbility,
    actor: JwtPayload | number,
  ): Promise<void> {
    const entity = await this.findOne(id, ability);
    this.assertCanModify(entity, actor);
    // RG-3 软删除：置 deleted_at，管理台回收站可恢复
    await this.tasksRepository.softDelete(entity.id);
    await this.logChange('delete', entity, this.actorIdOf(actor));
  }
}
