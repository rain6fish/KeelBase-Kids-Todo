// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTaskNoteMediaNullablePostgres1851000000000 implements MigrationInterface {
    name = 'AddTaskNoteMediaNullablePostgres1851000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`ALTER TABLE "task_notes" ALTER COLUMN "mediaUrl" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`UPDATE "task_notes" SET "mediaUrl" = '' WHERE "mediaUrl" IS NULL`);
        await queryRunner.query(`ALTER TABLE "task_notes" ALTER COLUMN "mediaUrl" SET NOT NULL`);
    }

}
