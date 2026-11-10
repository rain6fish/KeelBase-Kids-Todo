// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BadgeAwardsController } from './badge_awards.controller';
import { BadgeAwardsService } from './badge_awards.service';
import { BadgeAward } from './badge_award.entity';
import { Badge } from '../badges/badge.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BadgeAward, Badge])],
  controllers: [BadgeAwardsController],
  providers: [BadgeAwardsService],
  exports: [BadgeAwardsService],
})
export class BadgeAwardsModule {}
