// SPDX-License-Identifier: Apache-2.0

import { Injectable, Optional, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { subject } from '@casl/ability';
import { DailyReview } from './daily_review.entity';
import { CreateDailyReviewDto } from './dto/create-daily_review.dto';
import { UpdateDailyReviewDto } from './dto/update-daily_review.dto';
import type { AppAbility } from '../common/casl/casl-ability.factory';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FamilyScopeService } from '../common/services/family-scope.service';

/** 列表 `?q=` 匹配的列（spec 的 string / text 字段，按声明顺序）。 */
const DAILY_REVIEW_SEARCH_COLUMNS = ['content'];

@Injectable()
export class DailyReviewsService {
  constructor(
    @InjectRepository(DailyReview)
    private readonly daily_reviewsRepository: Repository<DailyReview>,
    @Optional() private readonly familyScope?: FamilyScopeService,
  ) {}

  private async resolveActor(actor: JwtPayload | number) {
    if (typeof actor !== 'number') return { userId: actor.sub, familyId: actor.familyId };
    const scope = await this.familyScope?.resolve(actor);
    return { userId: actor, familyId: scope?.familyId };
  }


  async create(dto: CreateDailyReviewDto, actor: JwtPayload | number): Promise<DailyReview> {
    const { userId, familyId } = await this.resolveActor(actor);
    const entity = this.daily_reviewsRepository.create({
      ...dto,
      userId,
      familyId,
    });
    return this.daily_reviewsRepository.save(entity);
  }

  async findAll(actor: JwtPayload | number, q?: string): Promise<DailyReview[]> {
    const { userId, familyId } = await this.resolveActor(actor);
    const scope = familyId != null ? { familyId } : { userId };
    const keyword = q?.trim();
    // Every arm carries the ownership condition, so a hit on any column still stays the caller's
    // own rows.
    // 每条分支各自带归属条件，故任何一列命中都仍限在调用方自己的行内。
    const where = keyword
      ? DAILY_REVIEW_SEARCH_COLUMNS.map((column) => ({ ...scope, [column]: Like(`%${keyword}%`) }))
      : scope;
    return this.daily_reviewsRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /** 管理端：全量列表（无 userId 过滤，admin） */
  async findAllForAdmin(): Promise<DailyReview[]> {
    return this.daily_reviewsRepository.find({ order: { createdAt: 'DESC' } });
  }

  /** 管理端：删除任意（软删进回收站，admin） */
  async removeAsAdmin(id: number): Promise<void> {
    await this.daily_reviewsRepository.softDelete(id);
  }

  async findOne(id: number, ability: AppAbility): Promise<DailyReview> {
    const entity = await this.daily_reviewsRepository.findOne({ where: { id }, });
    if (!entity) throw new NotFoundException('DailyReview not found');
    if (ability.cannot('read', subject('DailyReview', entity))) {
      throw new ForbiddenException('无权访问此每日评价');
    }
    return entity;
  }

  async update(id: number, dto: UpdateDailyReviewDto, ability: AppAbility): Promise<DailyReview> {
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
    const result = await this.daily_reviewsRepository.update(
      { id: entity.id, version },
      { ...fields, version: () => 'version + 1' },
    );
    if (!result.affected) {
      throw new ConflictException('该记录已被他人修改，请刷新后重试');
    }
    return this.findOne(id, ability);
  }

  async remove(id: number, ability: AppAbility): Promise<void> {
    const entity = await this.findOne(id, ability);
    // RG-3 软删除：置 deleted_at，管理台回收站可恢复
    await this.daily_reviewsRepository.softDelete(entity.id);
  }
}
