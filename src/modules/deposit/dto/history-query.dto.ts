import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  Max,
  Min,
} from 'class-validator';
import { DepositStatus } from '../entities/deposit.entity';

export class DepositHistoryQueryDto {
  @IsInt()
  @IsPositive()
  @Min(1)
  page = 1;

  @IsInt()
  @IsPositive()
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;
}
