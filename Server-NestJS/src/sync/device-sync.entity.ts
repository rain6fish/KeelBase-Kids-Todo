// SPDX-License-Identifier: Apache-2.0

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('device_sync')
@Index(['userId', 'deviceId'], { unique: true })
export class DeviceSync {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ name: 'user_id' })
  userId!: number;

  @Column({ nullable: true, name: 'family_id' })
  familyId?: number;

  @Column({ length: 100, name: 'device_id' })
  deviceId!: string;

  @Column({ length: 50, nullable: true, name: 'device_name' })
  deviceName?: string;

  /** ios | android | web */
  @Column({ length: 20, nullable: true })
  platform?: string;

  @Column({ type: Date, nullable: true, name: 'last_sync_at' })
  lastSyncAt?: Date | null;

  @Column({ default: 0, name: 'last_sync_seq' })
  lastSyncSeq!: number;

  @Column({ type: 'boolean', default: true, name: 'is_active' })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
