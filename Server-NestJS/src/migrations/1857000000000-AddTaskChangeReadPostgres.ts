// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

/** 小计划：任务已读位置增加变更流水 id（postgres 方言）。 */
export class AddTaskChangeReadPostgres1857000000000 implements MigrationInterface {
  name = 'AddTaskChangeReadPostgres1857000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return;
    await queryRunner.query(
      `ALTER TABLE "task_note_reads" ADD "last_read_change_id" integer NOT NULL DEFAULT '0'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return;
    await queryRunner.query(`ALTER TABLE "task_note_reads" DROP COLUMN "last_read_change_id"`);
  }
}
