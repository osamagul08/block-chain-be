import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { LoggerService } from '../../core/logger/logger.service';
import { Deposit, DepositStatus } from './entities/deposit.entity';
import { UserBalance } from './entities/user-balance.entity';
import { DepositService } from './deposit.service';
import { SolanaService } from './solana.service';

@Injectable()
export class BlockchainMonitorService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(UserBalance)
    private readonly userBalanceRepo: Repository<UserBalance>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    private readonly solanaService: SolanaService,
    private readonly depositService: DepositService,
    private readonly logger: LoggerService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.resumeMonitoring();
  }

  private async resumeMonitoring(): Promise<void> {
    const addresses = await this.getRegisteredAddresses();
    if (addresses.length === 0) {
      return;
    }
    const balances = await this.userBalanceRepo.find({
      where: { solanaAddress: In(addresses) },
    });

    for (const balance of balances) {
      await this.ensureWebhook(balance).catch((error) => {
        this.logger.warn(
          `Webhook restore failed for ${balance.userId}: ${String(error)}`,
          BlockchainMonitorService.name,
        );
      });
    }

    const pending = await this.depositRepo.find({
      where: { status: In([DepositStatus.PENDING, DepositStatus.CONFIRMING]) },
    });

    for (const deposit of pending) {
      if (!deposit.txSignature) {
        continue;
      }
      const confirmed = await this.solanaService.isTransactionConfirmed(
        deposit.txSignature,
      );
      if (confirmed) {
        await this.depositService.processDeposit(
          deposit.solanaAddress,
          deposit.txSignature,
          Number(deposit.amountUsdc),
        );
      }
    }
  }

  private async ensureWebhook(balance: UserBalance): Promise<void> {
    if (!balance.solanaAddress) {
      return;
    }

    // If a webhook already exists, do nothing. Otherwise create one or fallback monitor.
    if (!balance.webhookId) {
      try {
        const webhookId = await this.solanaService.setupWebhook(
          balance.solanaAddress,
          balance.userId,
        );
        await this.userBalanceRepo.update(balance.id, { webhookId });
      } catch {
        this.logger.warn(
          `Setting webhook failed for ${balance.solanaAddress}, enabling fallback.`,
          BlockchainMonitorService.name,
        );
        await this.solanaService.monitorAddressFallback(
          balance.solanaAddress,
          (signature, amount) => {
            this.depositService
              .processDeposit(balance.solanaAddress, signature, amount)
              .catch((error) => {
                this.logger.error(
                  `Failed to process deposit: ${error.message}`,
                  error.stack,
                );
              });
          },
        );
      }
    }
  }

  private async getRegisteredAddresses(): Promise<string[]> {
    const records = await this.userBalanceRepo
      .createQueryBuilder('ub')
      .select('ub.solanaAddress', 'solanaAddress')
      .where('ub.solanaAddress IS NOT NULL')
      .getRawMany<{ solanaAddress: string }>();
    return records.map((r) => r.solanaAddress);
  }
}
