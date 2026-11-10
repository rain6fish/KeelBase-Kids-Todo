// SPDX-License-Identifier: Apache-2.0

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
} from 'typeorm';

/**
 * 家庭维度的变更流水：客户端按 `id > since` 增量拉取。
 * payload 存 JSON 文本（sqlite / postgres 都稳定），由 ChangeLogService 序列化/解析。
 */
@Entity('change_sequence')
@Index(['familyId', 'id'])
@Index(['entityType', 'entityId'])
export class ChangeSequence {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ length: 32, name: 'entity_type' })
  entityType!: string;

  @Column({ name: 'entity_id' })
  entityId!: number;

  /** insert | update | delete */
  @Column({ length: 16 })
  action!: string;

  @Column({ type: 'text' })
  payload!: string;

  @Column({ nullable: true, name: 'family_id' })
  familyId?: number;

  @Column({ nullable: true, name: 'user_id' })
  userId?: number;

  @CreateDateColumn()
  createdAt!: Date;
}
