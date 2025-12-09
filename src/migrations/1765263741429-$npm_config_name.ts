import { MigrationInterface, QueryRunner } from "typeorm";

export class  $npmConfigName1765263741429 implements MigrationInterface {
    name = ' $npmConfigName1765263741429'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "fullName"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "fullName" nvarchar(255)`);
    }

}
