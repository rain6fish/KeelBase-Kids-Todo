// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

/** 小计划：任务已读位置增加变更流水 id（列表页「有更新」提示）。 */
export class AddTaskChangeRead1856000000000 implements MigrationInterface {
  name = 'AddTaskChangeRead1856000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "task_note_reads" ADD COLUMN "last_read_change_id" integer NOT NULL DEFAULT (0)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "task_note_reads" DROP COLUMN "last_read_change_id"`);
  }
}
