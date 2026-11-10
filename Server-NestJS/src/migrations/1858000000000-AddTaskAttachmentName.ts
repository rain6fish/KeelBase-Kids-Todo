// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

/** 小计划：任务附件原始文件名（展示与类型识别用）。 */
export class AddTaskAttachmentName1858000000000 implements MigrationInterface {
  name = 'AddTaskAttachmentName1858000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "attachment_name" varchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "attachment_name"`);
  }
}
