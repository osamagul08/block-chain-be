import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { LoggerService } from '../../core/logger/logger.service';
import { Deposit, DepositStatus } from './entities/deposit.entity';
import { UserBalance } from './entities/user-balance.entity';
import { RegisterAddressDto } from './dto/register-address.dto';
import { DepositHistoryQueryDto } from './dto/history-query.dto';
import {
  DepositResponseDto,
  PaginatedDepositsResponseDto,
} from './dto/deposit-response.dto';
import { BalanceResponseDto } from './dto/balance-response.dto';
import { SolanaService } from './solana.service';

const MICRO_USDC = 1_000_000n;
const CENTS_PER_DOLLAR = 100n;

@Injectable()
export class DepositService {
  constructor(
    @InjectRepository(UserBalance)
    private readonly userBalanceRepo: Repository<UserBalance>,
    @InjectRepository(Deposit)
    private readonly depositRepo: Repository<Deposit>,
    private readonly dataSource: DataSource,
    private readonly solanaService: SolanaService,
    private readonly logger: LoggerService,
  ) {}

  async registerAddress(
    userId: string,
    { solanaAddress }: RegisterAddressDto,
  ): Promise<UserBalance> {
    const normalizedAddress = solanaAddress.trim();
    this.solanaService.validateAddressOrThrow(normalizedAddress);

    const webhookId = await this.createWebhookOrFallback(
      userId,
      normalizedAddress,
    );

    const existing = await this.userBalanceRepo.findOne({ where: { userId } });

    if (!existing) {
      const created = this.userBalanceRepo.create({
        userId,
        solanaAddress: normalizedAddress,
        webhookId,
        balanceUsd: '0',
        balanceUsdc: '0',
      });
      return this.userBalanceRepo.save(created);
    }

    // If address changed, remove old webhook before updating
    if (existing.webhookId && existing.solanaAddress !== normalizedAddress) {
      await this.solanaService.removeWebhook(existing.webhookId);
    }

    existing.solanaAddress = normalizedAddress;
    existing.webhookId = webhookId;
    return this.userBalanceRepo.save(existing);
  }

  async getRegisteredAddress(
    userId: string,
  ): Promise<{ solanaAddress: string }> {
    const balance = await this.userBalanceRepo.findOne({ where: { userId } });
    if (!balance) {
      throw new NotFoundException('No address registered yet.');
    }
    return { solanaAddress: balance.solanaAddress };
  }

  async getBalance(userId: string): Promise<BalanceResponseDto> {
    const balance = await this.userBalanceRepo.findOne({ where: { userId } });
    if (!balance) {
      return { balanceUsd: '0.00', lastUpdated: new Date() };
    }
    const formattedUsd = this.formatUsdString(balance.balanceUsdc);
    return { balanceUsd: formattedUsd, lastUpdated: balance.lastUpdated };
  }

  async getDepositHistory(
    userId: string,
    query: DepositHistoryQueryDto,
  ): Promise<PaginatedDepositsResponseDto> {
    const { page = 1, limit = 20, status } = query;
    const where = { userId, ...(status ? { status } : {}) };

    const [rows, total] = await this.depositRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      deposits: rows.map((d) => this.toDepositResponse(d)),
      total,
      page,
      limit,
    };
  }

  async getDepositStatus(
    userId: string,
    depositId: string,
  ): Promise<DepositResponseDto> {
    const deposit = await this.depositRepo.findOne({
      where: { id: depositId, userId },
    });
    if (!deposit) {
      throw new NotFoundException('Deposit not found.');
    }
    return this.toDepositResponse(deposit);
  }

  async processDeposit(
    solanaAddress: string,
    txSignature: string,
    amountUsdc: number,
  ): Promise<void> {
    if (amountUsdc <= 0) {
      throw new BadRequestException('Deposit amount must be positive.');
    }

    const userBalance = await this.userBalanceRepo.findOne({
      where: { solanaAddress },
    });
    if (!userBalance) {
      this.logger.warn(
        `Deposit received for unregistered address ${solanaAddress}`,
        DepositService.name,
      );
      return;
    }

    const amountMicro = this.toMicroUsdc(amountUsdc);
    await this.dataSource.transaction(async (manager) => {
      const depositRepo = manager.getRepository(Deposit);
      const balanceRepo = manager.getRepository(UserBalance);

      // Idempotency on txSignature
      const existingBySignature = await depositRepo.findOne({
        where: { txSignature },
        lock: { mode: 'pessimistic_read' },
      });
      if (
        existingBySignature &&
        existingBySignature.status === DepositStatus.COMPLETED
      ) {
        return;
      }

      const balanceRecord = await balanceRepo.findOne({
        where: { userId: userBalance.userId },
        lock: { mode: 'pessimistic_write' },
      });
      if (!balanceRecord) {
        throw new NotFoundException('Balance record missing.');
      }

      let deposit =
        existingBySignature ??
        (await depositRepo.findOne({
          where: {
            userId: userBalance.userId,
            solanaAddress,
            status: In([DepositStatus.PENDING, DepositStatus.CONFIRMING]),
          },
          lock: { mode: 'pessimistic_write' },
        }));

      if (!deposit) {
        deposit = depositRepo.create({
          userId: userBalance.userId,
          solanaAddress,
          txSignature,
          amountUsd: this.toUsdString(amountMicro),
          amountUsdc: this.toUsdcString(amountMicro),
          status: DepositStatus.CONFIRMING,
        });
      }

      const newMicroBalance =
        this.toMicroUsdc(balanceRecord.balanceUsdc) + amountMicro;
      balanceRecord.balanceUsdc = this.toUsdcString(newMicroBalance);
      balanceRecord.balanceUsd = this.toUsdString(newMicroBalance);

      deposit.amountUsd = this.toUsdString(amountMicro);
      deposit.amountUsdc = this.toUsdcString(amountMicro);
      deposit.status = DepositStatus.COMPLETED;
      deposit.txSignature = txSignature;
      deposit.completedAt = new Date();

      await balanceRepo.save(balanceRecord);
      await depositRepo.save(deposit);
    });

    this.logger.log(
      `Deposit completed: ${amountUsdc.toFixed(6)} USDC for user ${userBalance.userId}`,
    );
  }

  private async createWebhookOrFallback(
    userId: string,
    solanaAddress: string,
  ): Promise<string | null> {
    try {
      const webhookId = await this.solanaService.setupWebhook(
        solanaAddress,
        userId,
      );
      return webhookId;
    } catch {
      this.logger.warn(
        `Helius webhook failed for ${solanaAddress}, enabling fallback monitoring.`,
        DepositService.name,
      );
      await this.solanaService.monitorAddressFallback(
        solanaAddress,
        (signature, amount) => {
          this.processDeposit(solanaAddress, signature, amount).catch(
            (error) => {
              this.logger.error(
                `Failed to process deposit: ${error.message}`,
                error.stack,
              );
            },
          );
        },
      );
      return null;
    }
  }

  private toDepositResponse(entity: Deposit): DepositResponseDto {
    return {
      id: entity.id,
      amountUsd: entity.amountUsd,
      amountUsdc: entity.amountUsdc,
      status: entity.status,
      solanaAddress: entity.solanaAddress,
      txSignature: entity.txSignature,
      createdAt: entity.createdAt,
      completedAt: entity.completedAt,
    };
  }

  private toMicroUsdc(amount: number | string): bigint {
    const [wholeStr, fractionStr = ''] = String(amount).split('.');
    const whole = BigInt(wholeStr || '0');
    const fraction = BigInt((fractionStr + '000000').slice(0, 6));
    return whole * MICRO_USDC + fraction;
  }

  private toUsdcString(micro: bigint): string {
    const whole = micro / MICRO_USDC;
    const fraction = micro % MICRO_USDC;
    const fractionStr = fraction.toString().padStart(6, '0').replace(/0+$/, '');
    return fractionStr ? `${whole}.${fractionStr}` : whole.toString();
  }

  private toUsdString(micro: bigint): string {
    const cents = (micro * CENTS_PER_DOLLAR) / MICRO_USDC;
    const dollars = cents / CENTS_PER_DOLLAR;
    const centsRemainder = cents % CENTS_PER_DOLLAR;
    return `${dollars.toString()}.${centsRemainder
      .toString()
      .padStart(2, '0')}`;
  }

  private formatUsdString(balanceUsdc: string): string {
    const micro = this.toMicroUsdc(balanceUsdc);
    return this.toUsdString(micro);
  }
}
