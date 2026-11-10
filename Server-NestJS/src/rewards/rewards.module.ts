// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardsController } from './rewards.controller';
import { RewardsService } from './rewards.service';
import { Reward } from './reward.entity';
import { Achievement } from '../achievements/achievement.entity';
import { RewardRedemption } from '../reward_redemptions/reward_redemption.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Reward, Achievement, RewardRedemption])],
  controllers: [RewardsController],
  providers: [RewardsService],
  exports: [RewardsService],
})
export class RewardsModule {}
