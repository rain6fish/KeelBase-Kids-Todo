// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskNoteReadsPostgres1853000000000 implements MigrationInterface {
    name = 'AddTaskNoteReadsPostgres1853000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`CREATE TABLE "task_note_reads" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "task_id" integer NOT NULL, "last_read_note_id" integer NOT NULL DEFAULT '0', "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_2f5d7a431ac59a5a92e6a885fc3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e51ca658c326ffeb3c0d7c606a" ON "task_note_reads"  ("user_id", "task_id") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`DROP INDEX "public"."IDX_e51ca658c326ffeb3c0d7c606a"`);
        await queryRunner.query(`DROP TABLE "task_note_reads"`);
    }

}
