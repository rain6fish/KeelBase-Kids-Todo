// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

/** 小计划：任务附件列（单附件 URL，拍照/选文件上传后写入）。 */
export class AddTaskAttachment1854000000000 implements MigrationInterface {
  name = 'AddTaskAttachment1854000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" ADD COLUMN "attachment_url" varchar(255)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "tasks" DROP COLUMN "attachment_url"`);
  }
}
