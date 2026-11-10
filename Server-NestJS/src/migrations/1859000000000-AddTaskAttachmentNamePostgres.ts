// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

/** 小计划：任务附件原始文件名（postgres 方言）。 */
export class AddTaskAttachmentNamePostgres1859000000000 implements MigrationInterface {
  name = 'AddTaskAttachmentNamePostgres1859000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return;
    await queryRunner.query(`ALTER TABLE "tasks" ADD "attachment_name" character varying(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    if (queryRunner.connection.options.type !== 'postgres') return;
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "attachment_name"`);
  }
}
