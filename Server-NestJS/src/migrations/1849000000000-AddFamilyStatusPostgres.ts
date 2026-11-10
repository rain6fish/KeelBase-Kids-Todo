// SPDX-License-Identifier: Apache-2.0

import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFamilyStatusPostgres1849000000000 implements MigrationInterface {
    name = 'AddFamilyStatusPostgres1849000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`ALTER TABLE "families" ADD "status" character varying(16) NOT NULL DEFAULT 'active'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (queryRunner.connection.options.type !== 'postgres') return;
        await queryRunner.query(`ALTER TABLE "families" DROP COLUMN "status"`);
    }

}
