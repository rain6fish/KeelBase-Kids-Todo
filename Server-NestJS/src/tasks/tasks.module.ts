// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task } from './task.entity';
import { Achievement } from '../achievements/achievement.entity';
import { Checkin } from '../checkins/checkin.entity';
import { Badge } from '../badges/badge.entity';
import { BadgeAward } from '../badge_awards/badge_award.entity';
import { FamiliesModule } from '../families/families.module';
import { TaskProgressService } from './task-progress.service';

@Module({
  imports: [TypeOrmModule.forFeature([Task, Achievement, Checkin, Badge, BadgeAward]), FamiliesModule],
  controllers: [TasksController],
  providers: [TasksService, TaskProgressService],
  exports: [TasksService],
})
export class TasksModule {}
