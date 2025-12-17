import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepositController } from './deposit.controller';
import { DepositService } from './deposit.service';
import { UserBalance } from './entities/user-balance.entity';
import { Deposit } from './entities/deposit.entity';
import { BlockchainMonitorService } from './blockchain-monitor.service';
import { SolanaService } from './solana.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserBalance, Deposit])],
  controllers: [DepositController],
  providers: [DepositService, SolanaService, BlockchainMonitorService],
  exports: [DepositService],
})
export class DepositModule {}
