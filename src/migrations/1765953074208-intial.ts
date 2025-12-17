import { MigrationInterface, QueryRunner } from 'typeorm';

export class Intial1765953074208 implements MigrationInterface {
  name = 'Intial1765953074208';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "username" character varying(50), "walletAddress" character varying(255) NOT NULL, "email" character varying, "password" character varying, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastLoginAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"), CONSTRAINT "UQ_fc71cd6fb73f95244b23e2ef113" UNIQUE ("walletAddress"), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "user_balances" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "solanaAddress" character varying(100) NOT NULL, "webhookId" character varying(150), "balanceUsd" numeric(18,2) NOT NULL DEFAULT '0', "balanceUsdc" numeric(18,6) NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "lastUpdated" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_fc961fea2e90ea93847e43f7b4e" UNIQUE ("userId"), CONSTRAINT "REL_fc961fea2e90ea93847e43f7b4" UNIQUE ("userId"), CONSTRAINT "PK_bf6c91bf949d39175f095c6c3d4" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_balance_user" ON "user_balances" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_user_balance_solana_address" ON "user_balances" ("solanaAddress") `,
    );
    await queryRunner.query(
      `CREATE TABLE "auth" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "walletAddress" character varying(255) NOT NULL, "nonce" character varying(255) NOT NULL, "message" text NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "usedAt" TIMESTAMP WITH TIME ZONE, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7e416cf6172bc5aec04244f6459" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_26d8472ce653f5fffa673145a4" ON "auth" ("walletAddress", "nonce") `,
    );
    await queryRunner.query(
      `CREATE TABLE "deposits" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "solanaAddress" character varying(100) NOT NULL, "txSignature" character varying(200), "amountUsd" numeric(18,2) NOT NULL, "amountUsdc" numeric(18,6) NOT NULL, "status" "public"."deposits_status_enum" NOT NULL DEFAULT 'pending', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "completedAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_f49ba0cd446eaf7abb4953385d9" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deposit_user" ON "deposits" ("userId") `,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_deposit_solana_address" ON "deposits" ("solanaAddress") `,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_deposit_tx_signature" ON "deposits" ("txSignature") WHERE "txSignature" IS NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_balances" ADD CONSTRAINT "FK_fc961fea2e90ea93847e43f7b4e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "deposits" ADD CONSTRAINT "FK_968bcd26d29022f95d20bb70e21" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "deposits" DROP CONSTRAINT "FK_968bcd26d29022f95d20bb70e21"`,
    );
    await queryRunner.query(
      `ALTER TABLE "user_balances" DROP CONSTRAINT "FK_fc961fea2e90ea93847e43f7b4e"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_deposit_tx_signature"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_deposit_solana_address"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_deposit_user"`);
    await queryRunner.query(`DROP TABLE "deposits"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_26d8472ce653f5fffa673145a4"`,
    );
    await queryRunner.query(`DROP TABLE "auth"`);
    await queryRunner.query(
      `DROP INDEX "public"."IDX_user_balance_solana_address"`,
    );
    await queryRunner.query(`DROP INDEX "public"."IDX_user_balance_user"`);
    await queryRunner.query(`DROP TABLE "user_balances"`);
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
