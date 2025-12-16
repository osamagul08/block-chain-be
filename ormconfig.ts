import { DataSource } from 'typeorm';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
export const AppDataSource = new DataSource({
  type: 'postgres' as const,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string, 10),
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [resolve(__dirname, 'src/modules/**/entities/*{.ts,.js}')],
  migrations: [resolve(__dirname, 'src/migrations/**/*{.ts,.js}')],
});
