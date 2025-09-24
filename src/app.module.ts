import { Module } from '@nestjs/common';

import { CoreModule } from './core/core.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersController } from './modules/users/users.controller';

@Module({
  imports: [CoreModule, UsersModule, AuthModule],
  controllers: [UsersController],
})
export class AppModule {}
