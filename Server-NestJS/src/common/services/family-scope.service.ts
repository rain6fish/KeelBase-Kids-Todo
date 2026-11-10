// SPDX-License-Identifier: Apache-2.0

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';

export interface FamilyScope {
  userId: number;
  familyId?: number;
}

/**
 * 统一解析数据归属：控制器传完整 JWT（零查询），AI 工具只传 userId 时反查家庭。
 * 家庭共享模块（任务/备注/奖励/评价）都走这里，避免两套范围口径。
 */
@Injectable()
export class FamilyScopeService {
  constructor(
    @InjectRepository(User)
    private readonly users: Repository<User>,
  ) {}

  async resolve(userId: number): Promise<FamilyScope> {
    const user = await this.users.findOne({
      where: { id: userId },
      select: { id: true, familyId: true },
    });
    return { userId, familyId: user?.familyId };
  }
}
