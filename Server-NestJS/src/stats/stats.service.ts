// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, Repository } from 'typeorm';
import type { JwtPayload } from '../auth/interfaces/jwt-payload.interface';
import { Task } from '../tasks/task.entity';
import { Achievement } from '../achievements/achievement.entity';
import { Checkin } from '../checkins/checkin.entity';
import { User } from '../common/entities/user.entity';

function dayStart(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function dayEnd(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

function dayKey(date: Date): string {
  return new Date(date).toISOString().slice(0, 10);
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    @InjectRepository(Achievement)
    private readonly achievements: Repository<Achievement>,
    @InjectRepository(Checkin)
    private readonly checkins: Repository<Checkin>,
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  /**
   * 今日总览。App 会传用户本地日期 `date`（与任务列表同一口径）；不传时沿用 UTC 当天，
   * 保持既有调用方（Web 工作台）行为不变 —— 不能按 UTC 切天却拿去和本地日期的列表比。
   */
  async overview(user: JwtPayload, date?: string) {
    if (!user.familyId) {
      return { total: 0, done: 0, completionRate: 0, members: 0, points: 0 };
    }
    const day = date && DATE_KEY.test(date) ? date : dayKey(new Date());
    // 任务日期是无时区的日期值，落库为该日的 UTC 零点；按同一日锚定区间即与列表同日。
    const start = new Date(`${day}T00:00:00.000Z`);
    const end = new Date(`${day}T23:59:59.999Z`);
    const total = await this.tasks.count({
      where: { familyId: user.familyId, taskDate: Between(start, end) },
    });
    const done = await this.tasks.count({
      where: {
        familyId: user.familyId,
        taskDate: Between(start, end),
        status: 'done',
      },
    });
    const members = await this.users.count({ where: { familyId: user.familyId } });
    const points = await this.achievements
      .createQueryBuilder('a')
      .select('COALESCE(SUM(a.totalPoints), 0)', 'sum')
      .where('a.familyId = :familyId', { familyId: user.familyId })
      .getRawOne<{ sum: string }>();
    return {
      total,
      done,
      completionRate: total > 0 ? done / total : 0,
      members,
      points: Number(points?.sum ?? 0),
    };
  }

  async completionRate(user: JwtPayload, days = 7) {
    if (!user.familyId) return [];
    const span = Math.min(Math.max(days, 1), 30);
    const from = dayStart(new Date(Date.now() - (span - 1) * 86_400_000));
    const tasks = await this.tasks.find({
      where: { familyId: user.familyId, taskDate: Between(from, dayEnd(new Date())) },
      select: { taskDate: true, status: true },
    });

    const buckets = new Map<string, { total: number; done: number }>();
    for (const task of tasks) {
      const key = dayKey(task.taskDate);
      const bucket = buckets.get(key) ?? { total: 0, done: 0 };
      bucket.total += 1;
      if (task.status === 'done') bucket.done += 1;
      buckets.set(key, bucket);
    }
    return [...buckets.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        date,
        ...value,
        rate: value.total > 0 ? value.done / value.total : 0,
      }));
  }

  async childCreatedRatio(user: JwtPayload) {
    if (!user.familyId) return { total: 0, childCreated: 0, ratio: 0 };
    const children = await this.users.find({
      where: { familyId: user.familyId, familyRole: 'child' },
      select: { id: true },
    });
    const total = await this.tasks.count({ where: { familyId: user.familyId } });
    const childCreated = children.length
      ? await this.tasks.count({
          where: { familyId: user.familyId, userId: In(children.map((c) => c.id)) },
        })
      : 0;
    return { total, childCreated, ratio: total > 0 ? childCreated / total : 0 };
  }

  async streak(user: JwtPayload) {
    const achievement = await this.achievements.findOne({ where: { userId: user.sub } });
    const recent = await this.checkins.find({
      where: { userId: user.sub },
      order: { checkDate: 'DESC' },
      take: 30,
    });
    return {
      totalPoints: achievement?.totalPoints ?? 0,
      currentStreak: achievement?.currentStreak ?? 0,
      longestStreak: achievement?.longestStreak ?? 0,
      lastActiveDate: achievement?.lastActiveDate ?? null,
      checkins: recent.map((c) => ({
        date: dayKey(c.checkDate),
        isPerfect: c.isPerfect ?? false,
        totalTasks: c.totalTasks ?? 0,
        doneTasks: c.doneTasks ?? 0,
        pointsEarned: c.pointsEarned ?? 0,
      })),
    };
  }
}
