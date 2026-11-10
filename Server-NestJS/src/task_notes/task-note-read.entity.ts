// SPDX-License-Identifier: Apache-2.0

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  UpdateDateColumn,
} from 'typeorm';

/** 每个用户对每个任务的已读位置（最后读到的备注 id / 变更流水 id） */
@Entity('task_note_reads')
@Index(['userId', 'taskId'], { unique: true })
export class TaskNoteRead {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ name: 'task_id' })
  taskId!: number;

  @Column({ default: 0, name: 'last_read_note_id' })
  lastReadNoteId!: number;

  /** 已读到的变更流水 id（列表页「有更新」提示用） */
  @Column({ default: 0, name: 'last_read_change_id' })
  lastReadChangeId!: number;

  @UpdateDateColumn()
  updatedAt!: Date;
}
