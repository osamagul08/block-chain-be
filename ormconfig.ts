import { DataSource } from 'typeorm';
import { resolve } from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env' });
export const AppDataSource = new DataSource({
  type: 'mssql' as const,
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT as string, 10),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: false,
  logging: false,
  entities: [resolve(__dirname, 'src/modules/**/entities/*{.ts,.js}')],
  migrations: [__dirname + '/src/migrations/**/*{.ts,.js}'],
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
});
