// SPDX-License-Identifier: Apache-2.0

import { Injectable, NotFoundException, ForbiddenException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { subject } from '@casl/ability';
import { BadgeAward } from './badge_award.entity';
import { Badge } from '../badges/badge.entity';
import { CreateBadgeAwardDto } from './dto/create-badge_award.dto';
import { UpdateBadgeAwardDto } from './dto/update-badge_award.dto';
import type { AppAbility } from '../common/casl/casl-ability.factory';

@Injectable()
export class BadgeAwardsService {
  constructor(
    @InjectRepository(BadgeAward)
    private readonly badge_awardsRepository: Repository<BadgeAward>,
    @InjectRepository(Badge)
    private readonly badgesRepository: Repository<Badge>,
  ) {}

  /**
   * Ref validation: every foreign key must point at a row that exists.
   * A soft-deleted target counts as missing — TypeORM's find excludes those by default.
   *
   * 关联校验：每个外键都必须指向确实存在的行。软删的目标视为不存在 —— TypeORM 的
   * find 默认就把它们排除在外。
   */
  private async _assertRefs(dto: {
    badgeIdId?: number | null;
  }): Promise<void> {
    if (dto.badgeIdId != null) {
      const found = await this.badgesRepository.findOne({ where: { id: dto.badgeIdId } });
      if (!found) throw new BadRequestException('badgeIdId 指向的记录不存在');
    }
  }


  async create(dto: CreateBadgeAwardDto, userId: number): Promise<BadgeAward> {
    await this._assertRefs(dto);
    const entity = this.badge_awardsRepository.create({
      ...dto,
      userId,
    });
    return this.badge_awardsRepository.save(entity);
  }

  async findAll(userId: number): Promise<BadgeAward[]> {
    return this.badge_awardsRepository.find({
      where: { userId },
      relations: { badgeId: true }, order: { createdAt: 'DESC' },
    });
  }

  /** 管理端：全量列表（无 userId 过滤，admin） */
  async findAllForAdmin(): Promise<BadgeAward[]> {
    return this.badge_awardsRepository.find({ relations: { badgeId: true }, order: { createdAt: 'DESC' } });
  }

  /** 管理端：删除任意（软删进回收站，admin） */
  async removeAsAdmin(id: number): Promise<void> {
    await this.badge_awardsRepository.softDelete(id);
  }

  async findOne(id: number, ability: AppAbility): Promise<BadgeAward> {
    const entity = await this.badge_awardsRepository.findOne({ where: { id }, relations: { badgeId: true }, });
    if (!entity) throw new NotFoundException('BadgeAward not found');
    if (ability.cannot('read', subject('BadgeAward', entity))) {
      throw new ForbiddenException('无权访问此徽章授予');
    }
    return entity;
  }

  async update(id: number, dto: UpdateBadgeAwardDto, ability: AppAbility): Promise<BadgeAward> {
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
    const result = await this.badge_awardsRepository.update(
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
    await this.badge_awardsRepository.softDelete(entity.id);
  }
}
