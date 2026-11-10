// SPDX-License-Identifier: Apache-2.0

import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import type { AppAbility } from '../common/casl/casl-ability.factory';
import { ChangeLogService } from '../common/change-log/change-log.service';
import { TasksService } from '../tasks/tasks.service';
import { DeviceSync } from './device-sync.entity';
import { RegisterDeviceDto } from './dto/register-device.dto';
import { PushChangesDto, SyncChangeDto } from './dto/push-changes.dto';
import { AckDto } from './dto/ack.dto';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    @InjectRepository(DeviceSync)
    private readonly devices: Repository<DeviceSync>,
    private readonly changeLog: ChangeLogService,
    private readonly tasksService: TasksService,
  ) {}

  async registerDevice(user: JwtPayload, dto: RegisterDeviceDto): Promise<DeviceSync> {
    let device = await this.devices.findOne({
      where: { userId: user.sub, deviceId: dto.deviceId },
    });
    if (!device) {
      device = this.devices.create({ userId: user.sub, deviceId: dto.deviceId });
    }
    device.familyId = user.familyId;
    device.deviceName = dto.deviceName ?? device.deviceName;
    device.platform = dto.platform ?? device.platform;
    device.isActive = true;
    device.lastSyncAt = new Date();
    return this.devices.save(device);
  }

  async pull(user: JwtPayload, since: number, limit: number, deviceId?: string) {
    const span = Math.min(Math.max(limit, 1), 500);
    const rows = await this.changeLog.list(
      { familyId: user.familyId, userId: user.sub },
      Math.max(0, since),
      span,
    );
    const changes = this.changeLog.decode(rows);
    const latestSeq = changes.length
      ? changes[changes.length - 1].seq
      : Math.max(0, since);

    if (deviceId) {
      await this.touchDevice(user.sub, deviceId, latestSeq);
    }
    return { latestSeq, changes, hasMore: changes.length >= span };
  }

  async ack(user: JwtPayload, dto: AckDto): Promise<{ ok: true }> {
    await this.touchDevice(user.sub, dto.deviceId, dto.seq);
    return { ok: true };
  }

  /**
   * 应用客户端离线期间的本地变更。
   * 逐条返回结果：applied / conflict / error。冲突不整批失败——
   * 一个任务冲突不能让其它已经能落库的变更一起被丢弃。
   */
  async push(user: JwtPayload, ability: AppAbility, dto: PushChangesDto) {
    const results: Array<Record<string, unknown>> = [];

    for (const [index, change] of dto.changes.entries()) {
      try {
        const result = await this.applyChange(user, ability, change);
        results.push({ index, action: change.action, status: 'applied', ...result });
      } catch (err) {
        if (err instanceof ConflictException) {
          const current = await this.safeFind(change.entityId, ability);
          results.push({
            index,
            action: change.action,
            status: 'conflict',
            entityId: change.entityId,
            current,
          });
        } else {
          this.logger.warn(`sync push item failed: ${(err as Error).message}`);
          results.push({
            index,
            action: change.action,
            status: 'error',
            entityId: change.entityId,
            error: (err as Error).message,
          });
        }
      }
    }

    const applied = results.filter((r) => r.status === 'applied');
    return {
      applied: applied.length,
      conflicts: results.filter((r) => r.status === 'conflict').length,
      errors: results.filter((r) => r.status === 'error').length,
      results,
    };
  }

  private async applyChange(
    user: JwtPayload,
    ability: AppAbility,
    change: SyncChangeDto,
  ): Promise<Record<string, unknown>> {
    if (change.entityType !== 'task') {
      throw new Error(`不支持的实体类型：${change.entityType}`);
    }
    if (change.action === 'insert') {
      const task = await this.tasksService.create((change.payload ?? {}) as never, user);
      return { entityId: task.id };
    }
    if (!change.entityId) throw new Error('update/delete/complete 缺少 entityId');
    if (change.action === 'complete') {
      const task = await this.tasksService.complete(change.entityId, user, ability);
      return { entityId: task.id };
    }
    if (change.action === 'update') {
      const payload = { ...(change.payload ?? {}) } as Record<string, unknown>;
      if (change.baseVersion != null) payload.version = change.baseVersion;
      const task = await this.tasksService.update(
        change.entityId,
        payload as never,
        ability,
        user,
      );
      return { entityId: task.id };
    }
    await this.tasksService.remove(change.entityId, ability, user);
    return { entityId: change.entityId };
  }

  private async safeFind(id: number | undefined, ability: AppAbility) {
    if (!id) return null;
    try {
      return await this.tasksService.findOne(id, ability);
    } catch {
      return null;
    }
  }

  private async touchDevice(userId: number, deviceId: string, seq: number): Promise<void> {
    await this.devices.update(
      { userId, deviceId },
      { lastSyncAt: new Date(), lastSyncSeq: seq },
    );
  }
}
