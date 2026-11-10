// SPDX-License-Identifier: Apache-2.0

import { Injectable, Optional, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { subject } from '@casl/ability';
import { Familie } from './familie.entity';
import { CreateFamilieDto } from './dto/create-familie.dto';
import { UpdateFamilieDto } from './dto/update-familie.dto';
import type { AppAbility } from '../common/casl/casl-ability.factory';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { FamilyScopeService } from '../common/services/family-scope.service';

/** 列表 `?q=` 匹配的列（spec 的 string / text 字段，按声明顺序）。 */
const FAMILIE_SEARCH_COLUMNS = ['name', 'inviteCode', 'useTimeStart', 'useTimeEnd'];

@Injectable()
export class FamiliesService {
  constructor(
    @InjectRepository(Familie)
    private readonly familiesRepository: Repository<Familie>,
    @Optional() private readonly familyScope?: FamilyScopeService,
  ) {}

  private async resolveActor(actor: JwtPayload | number) {
    if (typeof actor !== 'number') return { userId: actor.sub, familyId: actor.familyId };
    const scope = await this.familyScope?.resolve(actor);
    return { userId: actor, familyId: scope?.familyId };
  }


  /** 创建家庭并生成唯一邀请码（注册家长时调用） */
  async createForOwner(name: string, userId: number): Promise<Familie> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = this.generateInviteCode();
      const exists = await this.familiesRepository.findOne({ where: { inviteCode } });
      if (exists) continue;
      const entity = this.familiesRepository.create({ name, inviteCode, userId });
      return this.familiesRepository.save(entity);
    }
    throw new ConflictException('邀请码生成失败，请重试');
  }

  findByInviteCode(inviteCode: string): Promise<Familie | null> {
    return this.familiesRepository.findOne({ where: { inviteCode: inviteCode.toUpperCase() } });
  }

  async findOneRaw(id: number): Promise<Familie> {
    const entity = await this.familiesRepository.findOne({ where: { id } });
    if (!entity) throw new NotFoundException('家庭不存在');
    return entity;
  }

  async updateSettings(
    id: number,
    fields: Partial<
      Pick<
        Familie,
        'name' | 'approvalMode' | 'useTimeStart' | 'useTimeEnd' | 'inviteCode' | 'status'
      >
    >,
  ): Promise<Familie> {
    await this.familiesRepository.update({ id }, fields);
    return this.findOneRaw(id);
  }

  async regenerateInviteCode(id: number): Promise<Familie> {
    for (let attempt = 0; attempt < 5; attempt++) {
      const inviteCode = this.generateInviteCode();
      const exists = await this.familiesRepository.findOne({ where: { inviteCode } });
      if (exists) continue;
      return this.updateSettings(id, { inviteCode });
    }
    throw new ConflictException('邀请码生成失败，请重试');
  }

  private generateInviteCode(): string {
    // 去掉易混淆字符（0/O/1/I），8 位足够家庭邀请使用
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return code;
  }

  async create(dto: CreateFamilieDto, userId: number): Promise<Familie> {
    const entity = this.familiesRepository.create({
      ...dto,
      userId,
    });
    return this.familiesRepository.save(entity);
  }

  async findAll(actor: JwtPayload | number, q?: string): Promise<Familie[]> {
    const { userId, familyId } = await this.resolveActor(actor);
    // 家庭共享：成员看到的是自己所属的那一个家庭，而不是「谁创建的家庭」
    if (familyId != null) {
      const family = await this.familiesRepository.findOne({ where: { id: familyId } });
      return family ? [family] : [];
    }
    const keyword = q?.trim();
    // Every arm carries the ownership condition, so a hit on any column still stays the caller's
    // own rows.
    // 每条分支各自带归属条件，故任何一列命中都仍限在调用方自己的行内。
    const where = keyword
      ? FAMILIE_SEARCH_COLUMNS.map((column) => ({ userId, [column]: Like(`%${keyword}%`) }))
      : { userId };
    return this.familiesRepository.find({
      where,
      order: { createdAt: 'DESC' },
    });
  }

  /** 管理端：全量列表（无 userId 过滤，admin） */
  async findAllForAdmin(): Promise<Familie[]> {
    return this.familiesRepository.find({ order: { createdAt: 'DESC' } });
  }

  /** 管理端：停用家庭（只改状态，不物理删除） */
  async removeAsAdmin(id: number): Promise<void> {
    await this.familiesRepository.update({ id }, { status: 'inactive' });
  }

  async findOne(id: number, ability: AppAbility): Promise<Familie> {
    const entity = await this.familiesRepository.findOne({ where: { id }, });
    if (!entity) throw new NotFoundException('Familie not found');
    if (ability.cannot('read', subject('Familie', entity))) {
      throw new ForbiddenException('无权访问此家庭');
    }
    return entity;
  }

  async update(id: number, dto: UpdateFamilieDto, ability: AppAbility): Promise<Familie> {
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
    const result = await this.familiesRepository.update(
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
    // 家庭删除只改状态：保留成员、任务、积分等全部数据，便于恢复
    await this.familiesRepository.update({ id: entity.id }, { status: 'inactive' });
  }
}
