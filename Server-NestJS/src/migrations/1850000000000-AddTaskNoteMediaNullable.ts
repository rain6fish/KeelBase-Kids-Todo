// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * task_notes.mediaUrl 改为可空：文字备注不需要媒体地址。
 * sqlite 通过「临时表重建 + RENAME」修改列可空性；索引名沿用生成器给出的 hash 名。
 */
export class AddTaskNoteMediaNullable1850000000000 implements MigrationInterface {
  name = 'AddTaskNoteMediaNullable1850000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_92a24a2fe29ffb74934ddd8e58"`);
    await queryRunner.query(`DROP INDEX "IDX_83736170382f6079fab3915295"`);
    await queryRunner.query(`DROP INDEX "IDX_task_notes_family_id"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_task_notes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "task_id_id" integer, "content" text NOT NULL, "contentType" varchar(32) NOT NULL DEFAULT ('text'), "mediaUrl" varchar(200), "user_id" integer, "family_id" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "version" integer NOT NULL DEFAULT (1), "deleted_at" datetime, CONSTRAINT "FK_83736170382f6079fab39152951" FOREIGN KEY ("task_id_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "temporary_task_notes"("id", "task_id_id", "content", "contentType", "mediaUrl", "user_id", "family_id", "createdAt", "updatedAt", "version", "deleted_at") SELECT "id", "task_id_id", "content", "contentType", "mediaUrl", "user_id", "family_id", "createdAt", "updatedAt", "version", "deleted_at" FROM "task_notes"`,
    );
    await queryRunner.query(`DROP TABLE "task_notes"`);
    await queryRunner.query(`ALTER TABLE "temporary_task_notes" RENAME TO "task_notes"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_92a24a2fe29ffb74934ddd8e58" ON "task_notes" ("user_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83736170382f6079fab3915295" ON "task_notes" ("task_id_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_task_notes_family_id" ON "task_notes" ("family_id") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_task_notes_family_id"`);
    await queryRunner.query(`DROP INDEX "IDX_83736170382f6079fab3915295"`);
    await queryRunner.query(`DROP INDEX "IDX_92a24a2fe29ffb74934ddd8e58"`);
    await queryRunner.query(`ALTER TABLE "task_notes" RENAME TO "temporary_task_notes"`);
    await queryRunner.query(
      `CREATE TABLE "task_notes" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "task_id_id" integer, "content" text NOT NULL, "contentType" varchar(32) NOT NULL DEFAULT ('text'), "mediaUrl" varchar(200) NOT NULL, "user_id" integer, "family_id" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "version" integer NOT NULL DEFAULT (1), "deleted_at" datetime, CONSTRAINT "FK_83736170382f6079fab39152951" FOREIGN KEY ("task_id_id") REFERENCES "tasks" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`,
    );
    await queryRunner.query(
      `INSERT INTO "task_notes"("id", "task_id_id", "content", "contentType", "mediaUrl", "user_id", "family_id", "createdAt", "updatedAt", "version", "deleted_at") SELECT "id", "task_id_id", "content", "contentType", COALESCE("mediaUrl", ''), "user_id", "family_id", "createdAt", "updatedAt", "version", "deleted_at" FROM "temporary_task_notes"`,
    );
    await queryRunner.query(`DROP TABLE "temporary_task_notes"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_task_notes_family_id" ON "task_notes" ("family_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_83736170382f6079fab3915295" ON "task_notes" ("task_id_id") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_92a24a2fe29ffb74934ddd8e58" ON "task_notes" ("user_id") `,
    );
  }
}
