// SPDX-License-Identifier: Apache-2.0

import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { FamilyScopeService } from './family-scope.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  providers: [FamilyScopeService],
  exports: [FamilyScopeService],
})
export class FamilyScopeModule {}
