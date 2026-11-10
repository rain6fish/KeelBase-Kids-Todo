// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

/** 小计划：任务附件列（postgres 方言）。 */
export class AddTaskAttachmentPostgres1855000000000 implements MigrationInterface {
  name = 'AddTaskAttachmentPostgres1855000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return;
    await queryRunner.query(`ALTER TABLE "tasks" ADD "attachment_url" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return;
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "attachment_url"`);
  }
}
