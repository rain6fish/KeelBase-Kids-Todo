// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FamiliesController } from './families.controller';
import { FamiliesService } from './families.service';
import { Familie } from './familie.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Familie])],
  controllers: [FamiliesController],
  providers: [FamiliesService],
  exports: [FamiliesService],
})
export class FamiliesModule {}
