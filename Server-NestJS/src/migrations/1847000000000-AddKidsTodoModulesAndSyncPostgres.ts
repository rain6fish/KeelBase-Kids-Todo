// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddKidsTodoModulesAndSyncPostgres1847000000000 implements MigrationInterface {
    name = 'AddKidsTodoModulesAndSyncPostgres1847000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // SQLite 分支会加载全部迁移（含本文件）；postgres 专用迁移在 sqlite 下必须 no-op
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`CREATE TABLE "achievements" ("id" SERIAL NOT NULL, "totalPoints" integer, "currentStreak" integer, "longestStreak" integer, "lastActiveDate" TIMESTAMP, "user_id" integer, "family_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_1bc19c37c6249f70186f318d71d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_achievements_family_id" ON "achievements"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_0c0cd24bc6e722c12cd4575043" ON "achievements"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "badges" ("id" SERIAL NOT NULL, "name" character varying(200) NOT NULL, "description" text, "badgeType" character varying(32) NOT NULL DEFAULT 'streak_3', "threshold" integer, "iconUrl" character varying(200) NOT NULL, "user_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_8a651318b8de577e8e217676466" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7ea16468e9a25bfe47a898c3af" ON "badges"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "badge_awards" ("id" SERIAL NOT NULL, "badge_id_id" integer, "earnedOn" TIMESTAMP, "user_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_5fa679a182a2bd25a7be1ab1e6a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fa0e6b0f30cdf8ca44fd949397" ON "badge_awards"  ("badge_id_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_714de92fcb44904d690081264c" ON "badge_awards"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "checkins" ("id" SERIAL NOT NULL, "checkDate" TIMESTAMP NOT NULL, "totalTasks" integer, "doneTasks" integer, "isPerfect" boolean, "pointsEarned" integer, "user_id" integer, "family_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_99c62633386398b154840f0708c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_checkins_family_id" ON "checkins"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4bee1e59fa58838948f443e531" ON "checkins"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "daily_reviews" ("id" SERIAL NOT NULL, "reviewDate" TIMESTAMP NOT NULL, "content" text NOT NULL, "rating" integer, "user_id" integer, "family_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_391827f316b10655d06c2d00fcf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_daily_reviews_family_id" ON "daily_reviews"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4e64abffedfdabadb8fc49bda0" ON "daily_reviews"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "families" ("id" SERIAL NOT NULL, "name" character varying(200) NOT NULL, "inviteCode" character varying(8) NOT NULL, "approvalMode" boolean, "useTimeStart" character varying(200), "useTimeEnd" character varying(200), "user_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_70414ac0c8f45664cf71324b9bb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_families_invite_code" ON "families"  ("inviteCode") `);
        await queryRunner.query(`CREATE INDEX "IDX_7bac7cd103d0a37c6402a0ea4b" ON "families"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "rewards" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "description" text, "pointsCost" integer NOT NULL, "isActive" boolean, "user_id" integer, "family_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_3d947441a48debeb9b7366f8b8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_rewards_family_id" ON "rewards"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_119e21376b9f407077a81c05be" ON "rewards"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "reward_redemptions" ("id" SERIAL NOT NULL, "reward_id_id" integer, "pointsSpent" integer NOT NULL, "isCancelled" boolean, "note" text, "user_id" integer, "family_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_e02d178fa8c54295d8edc8781b3" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_reward_redemptions_family_id" ON "reward_redemptions"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4ed21af5e53efec1e62c563e77" ON "reward_redemptions"  ("reward_id_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_8e40cc924716518bc5d1828ce3" ON "reward_redemptions"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "device_sync" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "family_id" integer, "device_id" character varying(100) NOT NULL, "device_name" character varying(50), "platform" character varying(20), "last_sync_at" TIMESTAMP, "last_sync_seq" integer NOT NULL DEFAULT '0', "is_active" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_020065a36f40dcd7ec633b0cf9f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_69f0c92a6dfcc5b91a30ccd7ed" ON "device_sync"  ("user_id", "device_id") `);
        await queryRunner.query(`CREATE TABLE "change_sequence" ("id" SERIAL NOT NULL, "entity_type" character varying(32) NOT NULL, "entity_id" integer NOT NULL, "action" character varying(16) NOT NULL, "payload" text NOT NULL, "family_id" integer, "user_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_31e4554f0f9b429c5ddd89622d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_bb32e9c27a3cd8b7f42ae7dc7e" ON "change_sequence"  ("entity_type", "entity_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a5349f0ae7638b82c8fc21ef2a" ON "change_sequence"  ("family_id", "id") `);
        await queryRunner.query(`CREATE TABLE "tasks" ("id" SERIAL NOT NULL, "title" character varying(200) NOT NULL, "description" text, "priority" character varying(32) NOT NULL DEFAULT 'low', "status" character varying(32) NOT NULL DEFAULT 'todo', "taskDate" TIMESTAMP NOT NULL, "estimatedMinutes" integer, "repeatRule" character varying(32) NOT NULL DEFAULT 'none', "approvalStatus" character varying(32) NOT NULL DEFAULT 'none', "helpRequested" boolean, "helpRequestNote" text, "sortOrder" integer, "user_id" integer, "family_id" integer, "assignee_id" integer, "completed_at" TIMESTAMP, "approved_by" integer, "approved_at" TIMESTAMP, "repeat_group_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_8d12ff38fcc62aaba2cab748772" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_family_id" ON "tasks"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_tasks_assignee_id" ON "tasks"  ("assignee_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_db55af84c226af9dce09487b61" ON "tasks"  ("user_id") `);
        await queryRunner.query(`CREATE TABLE "task_notes" ("id" SERIAL NOT NULL, "task_id_id" integer, "content" text NOT NULL, "contentType" character varying(32) NOT NULL DEFAULT 'text', "mediaUrl" character varying(200) NOT NULL, "user_id" integer, "family_id" integer, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "version" integer NOT NULL DEFAULT '1', "deleted_at" TIMESTAMP, CONSTRAINT "PK_85e3e7dfff9c342d8381ebd0699" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_task_notes_family_id" ON "task_notes"  ("family_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_83736170382f6079fab3915295" ON "task_notes"  ("task_id_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_92a24a2fe29ffb74934ddd8e58" ON "task_notes"  ("user_id") `);
        await queryRunner.query(`ALTER TABLE "users" ADD "family_id" integer`);
        await queryRunner.query(`ALTER TABLE "users" ADD "family_role" character varying(16)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "pin_hash" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "parent_label" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "color_tag" character varying(9) NOT NULL DEFAULT '#4A90D9'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "users" ADD "last_login_at" TIMESTAMP`);
        await queryRunner.query(`CREATE INDEX "IDX_users_family_id" ON "users"  ("family_id") `);
        await queryRunner.query(`ALTER TABLE "badge_awards" ADD CONSTRAINT "FK_fa0e6b0f30cdf8ca44fd9493977" FOREIGN KEY ("badge_id_id") REFERENCES "badges"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "reward_redemptions" ADD CONSTRAINT "FK_4ed21af5e53efec1e62c563e772" FOREIGN KEY ("reward_id_id") REFERENCES "rewards"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "task_notes" ADD CONSTRAINT "FK_83736170382f6079fab39152951" FOREIGN KEY ("task_id_id") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`ALTER TABLE "task_notes" DROP CONSTRAINT "FK_83736170382f6079fab39152951"`);
        await queryRunner.query(`ALTER TABLE "reward_redemptions" DROP CONSTRAINT "FK_4ed21af5e53efec1e62c563e772"`);
        await queryRunner.query(`ALTER TABLE "badge_awards" DROP CONSTRAINT "FK_fa0e6b0f30cdf8ca44fd9493977"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_family_id"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "last_login_at"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "color_tag"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "parent_label"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "pin_hash"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "family_role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "family_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_92a24a2fe29ffb74934ddd8e58"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_83736170382f6079fab3915295"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_task_notes_family_id"`);
        await queryRunner.query(`DROP TABLE "task_notes"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_db55af84c226af9dce09487b61"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_assignee_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_tasks_family_id"`);
        await queryRunner.query(`DROP TABLE "tasks"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a5349f0ae7638b82c8fc21ef2a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bb32e9c27a3cd8b7f42ae7dc7e"`);
        await queryRunner.query(`DROP TABLE "change_sequence"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_69f0c92a6dfcc5b91a30ccd7ed"`);
        await queryRunner.query(`DROP TABLE "device_sync"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8e40cc924716518bc5d1828ce3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4ed21af5e53efec1e62c563e77"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_reward_redemptions_family_id"`);
        await queryRunner.query(`DROP TABLE "reward_redemptions"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_119e21376b9f407077a81c05be"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_rewards_family_id"`);
        await queryRunner.query(`DROP TABLE "rewards"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7bac7cd103d0a37c6402a0ea4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_families_invite_code"`);
        await queryRunner.query(`DROP TABLE "families"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4e64abffedfdabadb8fc49bda0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_daily_reviews_family_id"`);
        await queryRunner.query(`DROP TABLE "daily_reviews"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4bee1e59fa58838948f443e531"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_checkins_family_id"`);
        await queryRunner.query(`DROP TABLE "checkins"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_714de92fcb44904d690081264c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fa0e6b0f30cdf8ca44fd949397"`);
        await queryRunner.query(`DROP TABLE "badge_awards"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7ea16468e9a25bfe47a898c3af"`);
        await queryRunner.query(`DROP TABLE "badges"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0c0cd24bc6e722c12cd4575043"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_achievements_family_id"`);
        await queryRunner.query(`DROP TABLE "achievements"`);
    }

}
