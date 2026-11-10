// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChangeSequence } from '../../sync/change-sequence.entity';
import { ChangeLogService } from './change-log.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ChangeSequence])],
  providers: [ChangeLogService],
  exports: [ChangeLogService],
})
export class ChangeLogModule {}
