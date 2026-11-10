// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskNoteReads1852000000000 implements MigrationInterface {
    name = 'AddTaskNoteReads1852000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "task_note_reads" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "user_id" integer NOT NULL, "task_id" integer NOT NULL, "last_read_note_id" integer NOT NULL DEFAULT (0), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e51ca658c326ffeb3c0d7c606a" ON "task_note_reads" ("user_id", "task_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_e51ca658c326ffeb3c0d7c606a"`);
        await queryRunner.query(`DROP TABLE "task_note_reads"`);
    }

}
