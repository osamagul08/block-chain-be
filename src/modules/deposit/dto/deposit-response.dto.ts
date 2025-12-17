import { DepositStatus } from '../entities/deposit.entity';

export class DepositResponseDto {
  id: string;
  amountUsd: string;
  amountUsdc: string;
  status: DepositStatus;
  solanaAddress: string;
  txSignature?: string | null;
  createdAt: Date;
  completedAt?: Date | null;
}

export class PaginatedDepositsResponseDto {
  deposits: DepositResponseDto[];
  total: number;
  page: number;
  limit: number;
}
