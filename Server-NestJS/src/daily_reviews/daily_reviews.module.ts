// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyReviewsController } from './daily_reviews.controller';
import { DailyReviewsService } from './daily_reviews.service';
import { DailyReview } from './daily_review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DailyReview])],
  controllers: [DailyReviewsController],
  providers: [DailyReviewsService],
  exports: [DailyReviewsService],
})
export class DailyReviewsModule {}
