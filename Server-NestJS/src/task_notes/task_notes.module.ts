// SPDX-License-Identifier: Apache-2.0

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TaskNotesController } from './task_notes.controller';
import { TaskNotesService } from './task_notes.service';
import { TaskNote } from './task_note.entity';
import { TaskNoteRead } from './task-note-read.entity';
import { Task } from '../tasks/task.entity';
import { ChangeSequence } from '../sync/change-sequence.entity';

@Module({
  imports: [TypeOrmModule.forFeature([TaskNote, TaskNoteRead, Task, ChangeSequence])],
  controllers: [TaskNotesController],
  providers: [TaskNotesService],
  exports: [TaskNotesService],
})
export class TaskNotesModule {}
