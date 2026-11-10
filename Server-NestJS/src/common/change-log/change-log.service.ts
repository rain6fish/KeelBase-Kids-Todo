// SPDX-License-Identifier: Apache-2.0

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { ChangeSequence } from '../../sync/change-sequence.entity';

export interface ChangeRecordInput {
  entityType: string;
  entityId: number;
  action: 'insert' | 'update' | 'delete';
  payload: unknown;
  familyId?: number;
  userId?: number;
}

@Injectable()
export class ChangeLogService {
  private readonly logger = new Logger(ChangeLogService.name);

  constructor(
    @InjectRepository(ChangeSequence)
    private readonly repo: Repository<ChangeSequence>,
  ) {}

  /**
   * 记录一条变更。**不向业务抛错**：同步日志写失败不应该回滚用户已经成功的写入；
   * 失败时打 warning，客户端最多晚一轮拿到这条变更（下次全量/重试兜底）。
   */
  async record(input: ChangeRecordInput): Promise<void> {
    try {
      await this.repo.save(
        this.repo.create({
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
          payload: JSON.stringify(input.payload ?? null),
          familyId: input.familyId,
          userId: input.userId,
        }),
      );
    } catch (err) {
      this.logger.warn(`change log write failed: ${(err as Error).message}`);
    }
  }

  async list(
    scope: { familyId?: number; userId?: number },
    since: number,
    limit: number,
  ): Promise<ChangeSequence[]> {
    const where = scope.familyId != null
      ? { familyId: scope.familyId, id: MoreThan(since) }
      : { userId: scope.userId, id: MoreThan(since) };
    return this.repo.find({
      where,
      order: { id: 'ASC' },
      take: limit,
    });
  }

  /** 单实体历史（任务详情页展示用），按时间倒序 */
  async listForEntity(
    scope: { familyId?: number; userId?: number },
    entityType: string,
    entityId: number,
  ) {
    const where = scope.familyId != null
      ? { familyId: scope.familyId, entityType, entityId }
      : { userId: scope.userId, entityType, entityId };
    const rows = await this.repo.find({ where, order: { id: 'DESC' }, take: 50 });
    return this.decode(rows);
  }

  decode(rows: ChangeSequence[]) {
    return rows.map((row) => ({
      seq: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      action: row.action,
      payload: this.parse(row.payload),
      userId: row.userId,
      createdAt: row.createdAt,
    }));
  }

  private parse(payload: string): unknown {
    try {
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}
