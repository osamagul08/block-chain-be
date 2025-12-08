import { MigrationInterface, QueryRunner } from 'typeorm';

export class $npmConfigName1765192104813 implements MigrationInterface {
  name = ' $npmConfigName1765192104813';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "auth" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_7e416cf6172bc5aec04244f6459" DEFAULT NEWSEQUENTIALID(), "walletAddress" varchar(255) NOT NULL, "nonce" varchar(255) NOT NULL, "message" text NOT NULL, "expiresAt" datetime NOT NULL, "usedAt" datetime, "createdAt" datetime NOT NULL CONSTRAINT "DF_392eca727f7ab94f76fe3d687f8" DEFAULT getdate(), "updatedAt" datetime NOT NULL CONSTRAINT "DF_f9add8546ebede2f8f45002776a" DEFAULT getdate(), CONSTRAINT "PK_7e416cf6172bc5aec04244f6459" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_26d8472ce653f5fffa673145a4" ON "auth" ("walletAddress", "nonce") `,
    );
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uniqueidentifier NOT NULL CONSTRAINT "DF_a3ffb1c0c8416b9fc6f907b7433" DEFAULT NEWSEQUENTIALID(), "fullName" nvarchar(255), "walletAddress" varchar(255) NOT NULL, "email" nvarchar(255), "password" nvarchar(255), "isActive" bit NOT NULL CONSTRAINT "DF_409a0298fdd86a6495e23c25c66" DEFAULT 1, "createdAt" datetime NOT NULL CONSTRAINT "DF_204e9b624861ff4a5b268192101" DEFAULT getdate(), "updatedAt" datetime NOT NULL CONSTRAINT "DF_0f5cbe00928ba4489cc7312573b" DEFAULT getdate(), "lastLoginAt" datetime, CONSTRAINT "UQ_fc71cd6fb73f95244b23e2ef113" UNIQUE ("walletAddress"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(
      `DROP INDEX "IDX_26d8472ce653f5fffa673145a4" ON "auth"`,
    );
    await queryRunner.query(`DROP TABLE "auth"`);
  }
}
