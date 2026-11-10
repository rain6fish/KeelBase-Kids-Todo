// SPDX-License-Identifier: Apache-2.0

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  VersionColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('tasks')
@Index(['userId'])

export class Task {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  /** 任务附件（拍照/选文件上传后的 URL，单附件，重新上传即替换） */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'attachment_url' })
  attachmentUrl?: string | null;

  /** 附件原始文件名（展示用；URL 里是存储名，看不出类型） */
  @Column({ type: 'varchar', length: 255, nullable: true, name: 'attachment_name' })
  attachmentName?: string | null;

  @Column({ length: 32, default: 'low' })
  priority!: string;

  @Column({ length: 32, default: 'todo' })
  status!: string;

  @Column({ type: Date })
  taskDate!: Date;

  @Column({ nullable: true })
  estimatedMinutes?: number;

  @Column({ length: 32, default: 'none' })
  repeatRule!: string;

  @Column({ length: 32, default: 'none' })
  approvalStatus!: string;

  @Column({ type: 'boolean', nullable: true })
  helpRequested?: boolean;

  @Column({ type: 'text', nullable: true })
  helpRequestNote?: string | null;

  @Column({ nullable: true })
  sortOrder?: number;

  @Column({ nullable: true, name: 'user_id' })
  userId?: number;

  @Column({ nullable: true, name: 'family_id' })
  @Index('IDX_tasks_family_id')
  familyId?: number;

  /** 任务执行人（通常是孩子）；为空表示未指派 */
  @Column({ nullable: true, name: 'assignee_id' })
  @Index('IDX_tasks_assignee_id')
  assigneeId?: number;

  /** 完成时间（status=done 时写入） */
  @Column({ type: Date, nullable: true, name: 'completed_at' })
  completedAt?: Date | null;

  /** 审批人 / 审批时间（approvalStatus=approved/rejected） */
  @Column({ nullable: true, name: 'approved_by' })
  approvedBy?: number;

  @Column({ type: Date, nullable: true, name: 'approved_at' })
  approvedAt?: Date | null;

  /** 重复任务组（同一组的实例共享；创建时用首条任务 id） */
  @Column({ nullable: true, name: 'repeat_group_id' })
  repeatGroupId?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Bumped on every write. An update that carries a stale value is refused instead of silently
   * overwriting whoever wrote in between — the API answers that with 409. The optimistic lock is
   * the default here, not an opt-in: a generated module should not lose writes without saying so.
   *
   * 每次写入自增。携带陈旧值的更新会被拒绝，而不是**无声覆盖**中间写过的人 —— 接口以 409 作答。
   * 乐观锁在这里是**缺省**而非可选：生成的模块不该在丢写入时一声不吭。
   *
   * 「default: 1」不是装饰：没有它，这一列就是「NOT NULL 且无默认」，而**往已有数据的表上加这样一列
   * 会失败**（sqlite 因 NOT NULL 约束拒绝回填，Postgres 同样）。加了它，既有库才升得上来——且 1 正是
   * TypeORM 为版本列取的起始值，语义不变。
   *
   * The default of 1 is load-bearing, not decoration: without it this column is NOT NULL with no default,
   * and **adding such a column to a table that already has rows fails** — sqlite refuses the backfill on
   * the NOT NULL constraint, and Postgres does too. With it, existing databases can be upgraded; and 1 is
   * the value TypeORM already starts a version column at, so the semantics are unchanged.
   */
  @VersionColumn({ default: 1 })
  version!: number;


  /**
   * Trust-ready（生成模块默认可撤销）：RG-3 软删除——删除仅置 deleted_at 保留行，管理台回收站可恢复；
   * AI 写工具 create_task 副作用 resultType=task 可按本实体元数据软删撤销
   * （SideEffectRevoker.resolveLocalEntity 匹配本实体 + DeleteDateColumn → revokeClass=local_compensate）。
   */
  @DeleteDateColumn({ type: Date, name: 'deleted_at' })
  deletedAt?: Date | null;
}
