import { Module } from '@nestjs/common';

import { CoreModule } from './core/core.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { UsersController } from './modules/users/users.controller';

@Module({
  imports: [CoreModule, UsersModule, AuthModule, WalletModule],
  controllers: [UsersController],
})
export class AppModule {}
