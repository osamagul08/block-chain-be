// core/database/typeorm.config.ts
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const typeOrmConfig = (config: ConfigService): TypeOrmModuleOptions => ({
  type: 'mssql',
  host: config.get<string>('db.host'),
  port: config.get<number>('db.port'),
  username: config.get<string>('db.username'),
  password: config.get<string>('db.password'),
  database: config.get<string>('db.database'),
  entities: [join(__dirname, 'modules/**/entities/*.entity{.ts,.js}')],
  synchronize: false,
  autoLoadEntities: true,
  options: { encrypt: false },
  extra: {
    max: 10, // maximum number of connections in the pool
    min: 2, // minimum number of connections in the pool
  },
});
