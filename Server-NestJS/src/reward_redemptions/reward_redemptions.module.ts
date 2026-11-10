// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RewardRedemptionsController } from './reward_redemptions.controller';
import { RewardRedemptionsService } from './reward_redemptions.service';
import { RewardRedemption } from './reward_redemption.entity';
import { Reward } from '../rewards/reward.entity';

@Module({
  imports: [TypeOrmModule.forFeature([RewardRedemption, Reward])],
  controllers: [RewardRedemptionsController],
  providers: [RewardRedemptionsService],
  exports: [RewardRedemptionsService],
})
export class RewardRedemptionsModule {}
