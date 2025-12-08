import { MigrationInterface, QueryRunner } from 'typeorm';

export class $npmConfigName1765195907760 implements MigrationInterface {
  name = ' $npmConfigName1765195907760';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Clear all data first (ONLY DO THIS IN DEVELOPMENT!)
    await queryRunner.query(`DELETE FROM "auth"`);

    // Now the original migration will work
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "message"`);
    await queryRunner.query(
      `ALTER TABLE "auth" ADD "message" varchar(MAX) NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "expiresAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth" ADD "expiresAt" datetime2 NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "usedAt"`);
    await queryRunner.query(`ALTER TABLE "auth" ADD "usedAt" datetime2`);
    await queryRunner.query(
      `ALTER TABLE "auth" DROP CONSTRAINT "DF_392eca727f7ab94f76fe3d687f8"`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth" ADD "createdAt" datetime2 NOT NULL CONSTRAINT "DF_392eca727f7ab94f76fe3d687f8" DEFAULT getdate()`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth" DROP CONSTRAINT "DF_f9add8546ebede2f8f45002776a"`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth" ADD "updatedAt" datetime2 NOT NULL CONSTRAINT "DF_f9add8546ebede2f8f45002776a" DEFAULT getdate()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "auth" DROP CONSTRAINT "DF_f9add8546ebede2f8f45002776a"`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "updatedAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth" ADD "updatedAt" datetime NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth" ADD CONSTRAINT "DF_f9add8546ebede2f8f45002776a" DEFAULT getdate() FOR "updatedAt"`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth" DROP CONSTRAINT "DF_392eca727f7ab94f76fe3d687f8"`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "createdAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth" ADD "createdAt" datetime NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "auth" ADD CONSTRAINT "DF_392eca727f7ab94f76fe3d687f8" DEFAULT getdate() FOR "createdAt"`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "usedAt"`);
    await queryRunner.query(`ALTER TABLE "auth" ADD "usedAt" datetime`);
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "expiresAt"`);
    await queryRunner.query(
      `ALTER TABLE "auth" ADD "expiresAt" datetime NOT NULL`,
    );
    await queryRunner.query(`ALTER TABLE "auth" DROP COLUMN "message"`);
    await queryRunner.query(`ALTER TABLE "auth" ADD "message" text NOT NULL`);
  }
}
