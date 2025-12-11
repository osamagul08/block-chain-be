// src/core/core.module.ts
import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { LoggerService } from './logger/logger.service';
import { validationSchema } from './config/validation.config';
import configuration from './config/configuration.config';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: validationSchema,
      envFilePath: ['.env'],
    }),
    DatabaseModule,
  ],
  providers: [LoggerService],
  exports: [LoggerService, DatabaseModule, ConfigModule],
})
export class CoreModule {}
