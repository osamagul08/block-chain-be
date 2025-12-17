import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HeliusTokenTransferDto {
  @IsString()
  source: string;

  @IsString()
  destination: string;

  @IsString()
  mint: string;

  @IsNumber()
  amount: number;

  @IsNumber()
  decimals: number;

  @IsOptional()
  @IsString()
  tokenAccount?: string;
}

export class HeliusWebhookDto {
  @IsOptional()
  @IsString()
  webhookId?: string;

  @IsString()
  type: string;

  @IsString()
  signature: string;

  @IsNumber()
  timestamp: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeliusTokenTransferDto)
  tokenTransfers?: HeliusTokenTransferDto[];
}
