// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFamilyStatus1848000000000 implements MigrationInterface {
    name = 'AddFamilyStatus1848000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_7bac7cd103d0a37c6402a0ea4b"`);
        await queryRunner.query(`DROP INDEX "IDX_families_invite_code"`);
        await queryRunner.query(`CREATE TABLE "temporary_families" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(200) NOT NULL, "inviteCode" varchar(8) NOT NULL, "approvalMode" boolean, "useTimeStart" varchar(200), "useTimeEnd" varchar(200), "user_id" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "version" integer NOT NULL DEFAULT (1), "deleted_at" datetime, "status" varchar(16) NOT NULL DEFAULT ('active'))`);
        await queryRunner.query(`INSERT INTO "temporary_families"("id", "name", "inviteCode", "approvalMode", "useTimeStart", "useTimeEnd", "user_id", "createdAt", "updatedAt", "version", "deleted_at") SELECT "id", "name", "inviteCode", "approvalMode", "useTimeStart", "useTimeEnd", "user_id", "createdAt", "updatedAt", "version", "deleted_at" FROM "families"`);
        await queryRunner.query(`DROP TABLE "families"`);
        await queryRunner.query(`ALTER TABLE "temporary_families" RENAME TO "families"`);
        await queryRunner.query(`CREATE INDEX "IDX_7bac7cd103d0a37c6402a0ea4b" ON "families" ("user_id") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_families_invite_code" ON "families" ("inviteCode") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_families_invite_code"`);
        await queryRunner.query(`DROP INDEX "IDX_7bac7cd103d0a37c6402a0ea4b"`);
        await queryRunner.query(`ALTER TABLE "families" RENAME TO "temporary_families"`);
        await queryRunner.query(`CREATE TABLE "families" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "name" varchar(200) NOT NULL, "inviteCode" varchar(8) NOT NULL, "approvalMode" boolean, "useTimeStart" varchar(200), "useTimeEnd" varchar(200), "user_id" integer, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), "version" integer NOT NULL DEFAULT (1), "deleted_at" datetime)`);
        await queryRunner.query(`INSERT INTO "families"("id", "name", "inviteCode", "approvalMode", "useTimeStart", "useTimeEnd", "user_id", "createdAt", "updatedAt", "version", "deleted_at") SELECT "id", "name", "inviteCode", "approvalMode", "useTimeStart", "useTimeEnd", "user_id", "createdAt", "updatedAt", "version", "deleted_at" FROM "temporary_families"`);
        await queryRunner.query(`DROP TABLE "temporary_families"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_families_invite_code" ON "families" ("inviteCode") `);
        await queryRunner.query(`CREATE INDEX "IDX_7bac7cd103d0a37c6402a0ea4b" ON "families" ("user_id") `);
    }

}
