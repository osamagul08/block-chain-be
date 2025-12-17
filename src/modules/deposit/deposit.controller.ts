import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UnauthorizedException,
} from '@nestjs/common';
import { DepositService } from './deposit.service';
import { RegisterAddressDto } from './dto/register-address.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtValidatedUser } from '../auth/jwt.strategy';
import { DepositHistoryQueryDto } from './dto/history-query.dto';
import { DepositResponseDto } from './dto/deposit-response.dto';
import { HeliusWebhookDto } from './dto/helius-webhook.dto';
import { SkipAuth } from '../../common/decorators/skip-auth.decorator';
import { SolanaService } from './solana.service';

@Controller('deposits')
export class DepositController {
  constructor(
    private readonly depositService: DepositService,
    private readonly solanaService: SolanaService,
  ) {}

  @Post('register-address')
  async registerAddress(
    @CurrentUser() user: JwtValidatedUser,
    @Body() dto: RegisterAddressDto,
  ) {
    const balance = await this.depositService.registerAddress(user.id, dto);
    return {
      message:
        'Your deposit address is ready. Send USDC to this address and we will credit your balance.',
      solanaAddress: balance.solanaAddress,
      webhookId: balance.webhookId ?? null,
    };
  }

  @Get('address')
  async getRegisteredAddress(@CurrentUser() user: JwtValidatedUser) {
    return this.depositService.getRegisteredAddress(user.id);
  }

  @Get('balance')
  async getBalance(@CurrentUser() user: JwtValidatedUser) {
    return this.depositService.getBalance(user.id);
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: JwtValidatedUser,
    @Query() query: DepositHistoryQueryDto,
  ) {
    return this.depositService.getDepositHistory(user.id, query);
  }

  @Get(':depositId/status')
  async getDepositStatus(
    @CurrentUser() user: JwtValidatedUser,
    @Param('depositId') depositId: string,
  ): Promise<DepositResponseDto> {
    return this.depositService.getDepositStatus(user.id, depositId);
  }

  @Post('webhook')
  @SkipAuth()
  async handleWebhook(
    @Headers('x-helius-signature') signatureHeader: string | undefined,
    @Body() webhook: HeliusWebhookDto,
  ) {
    const isValid = this.solanaService.validateWebhookSignature(
      signatureHeader,
      webhook,
    );
    if (!isValid) {
      throw new UnauthorizedException('Invalid webhook signature.');
    }

    const transfer = this.pickUsdcTransfer(webhook);
    if (!transfer) {
      return { received: true, ignored: 'No USDC transfer detected.' };
    }

    const decimals = transfer.decimals ?? 6;
    const amountUsdc = transfer.amount / 10 ** decimals;
    const monitoredAddress = transfer.destination;

    await this.depositService.processDeposit(
      monitoredAddress,
      webhook.signature,
      amountUsdc,
    );

    return { received: true, message: 'Deposit processed.' };
  }

  private pickUsdcTransfer(webhook: HeliusWebhookDto) {
    if (!webhook.tokenTransfers || webhook.tokenTransfers.length === 0) {
      return null;
    }
    const usdcMint = this.solanaService.getUsdcMintAddress();
    return webhook.tokenTransfers.find((t) => t.mint === usdcMint) ?? null;
  }
}
