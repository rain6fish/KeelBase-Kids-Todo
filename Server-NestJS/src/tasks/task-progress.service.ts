// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './task.entity';
import { Achievement } from '../achievements/achievement.entity';
import { Checkin } from '../checkins/checkin.entity';
import { Badge } from '../badges/badge.entity';
import { BadgeAward } from '../badge_awards/badge_award.entity';

/** 徽章阈值兜底：DB 里没填 threshold 时按类型给默认值 */
const BADGE_THRESHOLDS: Record<string, number> = {
  streak_3: 3,
  streak_7: 7,
  streak_30: 30,
  streak_100: 100,
  points_50: 50,
  points_200: 200,
  points_500: 500,
  perfect_day: 1,
  perfect_week: 7,
};

const POINTS_PER_TASK = 10;

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

/**
 * 任务完成后的积分/连签/打卡结算。
 *
 * 只由 TasksService 在「状态变为 done」时调用；重复调用不会重复发分
 * （调用方先判断 status !== done）。积分与打卡是产品规则，放在独立 service，
 * 避免 TasksService 变成什么都往里塞的上帝类。
 */
@Injectable()
export class TaskProgressService {
  constructor(
    @InjectRepository(Task)
    private readonly tasks: Repository<Task>,
    @InjectRepository(Achievement)
    private readonly achievements: Repository<Achievement>,
    @InjectRepository(Checkin)
    private readonly checkins: Repository<Checkin>,
    @InjectRepository(Badge)
    private readonly badges: Repository<Badge>,
    @InjectRepository(BadgeAward)
    private readonly badgeAwards: Repository<BadgeAward>,
  ) {}

  async onCompleted(task: Task): Promise<void> {
    if (!task.assigneeId) return;

    const today = toDateString(task.completedAt ?? new Date());
    const yesterday = toDateString(new Date(Date.now() - 86_400_000));

    let achievement = await this.achievements.findOne({
      where: { userId: task.assigneeId },
    });
    if (!achievement) {
      achievement = this.achievements.create({
        userId: task.assigneeId,
        familyId: task.familyId,
        totalPoints: 0,
        currentStreak: 0,
        longestStreak: 0,
      });
    }

    const lastActive = achievement.lastActiveDate
      ? toDateString(new Date(achievement.lastActiveDate))
      : null;
    if (lastActive !== today) {
      achievement.currentStreak =
        lastActive === yesterday ? (achievement.currentStreak ?? 0) + 1 : 1;
      achievement.longestStreak = Math.max(
        achievement.longestStreak ?? 0,
        achievement.currentStreak,
      );
      achievement.lastActiveDate = today as unknown as Date;
    }
    achievement.totalPoints = (achievement.totalPoints ?? 0) + POINTS_PER_TASK;
    await this.achievements.save(achievement);

    const totalTasks = await this.tasks.count({
      where: { assigneeId: task.assigneeId, taskDate: task.taskDate },
    });
    const doneTasks = await this.tasks.count({
      where: { assigneeId: task.assigneeId, taskDate: task.taskDate, status: 'done' },
    });

    let checkin = await this.checkins.findOne({
      where: { userId: task.assigneeId, checkDate: task.taskDate },
    });
    if (!checkin) {
      checkin = this.checkins.create({
        userId: task.assigneeId,
        familyId: task.familyId,
        checkDate: task.taskDate,
      });
    }
    checkin.totalTasks = totalTasks;
    checkin.doneTasks = doneTasks;
    checkin.isPerfect = totalTasks > 0 && doneTasks >= totalTasks;
    checkin.pointsEarned = (checkin.pointsEarned ?? 0) + POINTS_PER_TASK;
    await this.checkins.save(checkin);

    await this.awardBadges(task, achievement, checkin);
  }

  /**
   * 撤销完成时的结算回退：扣回该任务发出的积分，并重算当天打卡。
   *
   * 不回退就会留下「完成 → 撤销 → 再完成」每次多给 10 分的口子；徽章与连签按已达成处理，
   * 不随撤销回收（历史成就保留）。
   */
  async onUncompleted(task: Task): Promise<void> {
    if (!task.assigneeId) return;

    const achievement = await this.achievements.findOne({
      where: { userId: task.assigneeId },
    });
    if (achievement) {
      achievement.totalPoints = Math.max(
        0,
        (achievement.totalPoints ?? 0) - POINTS_PER_TASK,
      );
      await this.achievements.save(achievement);
    }

    const checkin = await this.checkins.findOne({
      where: { userId: task.assigneeId, checkDate: task.taskDate },
    });
    if (!checkin) return;

    // 调用方已把状态改回 todo，这里重新统计才不含本任务
    const totalTasks = await this.tasks.count({
      where: { assigneeId: task.assigneeId, taskDate: task.taskDate },
    });
    const doneTasks = await this.tasks.count({
      where: { assigneeId: task.assigneeId, taskDate: task.taskDate, status: 'done' },
    });
    checkin.totalTasks = totalTasks;
    checkin.doneTasks = doneTasks;
    checkin.isPerfect = totalTasks > 0 && doneTasks >= totalTasks;
    checkin.pointsEarned = Math.max(0, (checkin.pointsEarned ?? 0) - POINTS_PER_TASK);
    await this.checkins.save(checkin);
  }

  /** 按连签/积分/完美日规则补发徽章；同一用户同一徽章只发一次 */
  private async awardBadges(
    task: Task,
    achievement: Achievement,
    checkin: Checkin,
  ): Promise<void> {
    const definitions = await this.badges.find();
    if (definitions.length === 0) return;

    const streak = achievement.currentStreak ?? 0;
    const points = achievement.totalPoints ?? 0;
    const recentCheckins = await this.checkins.find({
      where: { userId: task.assigneeId! },
      order: { checkDate: 'DESC' },
      take: 7,
    });
    const perfectWeek =
      recentCheckins.length >= 7 && recentCheckins.every((c) => c.isPerfect === true);
    // 同一 badgeType 只发一枚：徽章定义是全局的，重复定义不应让用户拿到重复奖励
    const awardedTypes = new Set<string>();

    for (const badge of definitions) {
      if (awardedTypes.has(badge.badgeType)) continue;
      const threshold = badge.threshold ?? BADGE_THRESHOLDS[badge.badgeType] ?? Number.MAX_SAFE_INTEGER;
      let met = false;
      if (badge.badgeType.startsWith('streak_')) met = streak >= threshold;
      else if (badge.badgeType.startsWith('points_')) met = points >= threshold;
      else if (badge.badgeType === 'perfect_day') met = checkin.isPerfect === true;
      else if (badge.badgeType === 'perfect_week') met = perfectWeek;
      if (!met) continue;

      const exists = await this.badgeAwards.findOne({
        where: { userId: task.assigneeId!, badgeIdId: badge.id },
      });
      if (exists) continue;

      await this.badgeAwards.save(
        this.badgeAwards.create({
          userId: task.assigneeId,
          badgeIdId: badge.id,
          earnedOn: new Date(toDateString(task.completedAt ?? new Date())) as unknown as Date,
        }),
      );
      awardedTypes.add(badge.badgeType);
    }
  }
}
