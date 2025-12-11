import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

import { CoreModule } from './core/core.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { WalletModule } from './modules/wallet/wallet.module';
import { UsersController } from './modules/users/users.controller';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { ThrottlerConfig } from './core/config/throttler.config';

@Module({
  imports: [CoreModule, UsersModule, AuthModule, WalletModule, ThrottlerConfig],
  controllers: [UsersController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
