import { BadRequestException, Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  Connection,
  ParsedTransactionWithMeta,
  PublicKey,
} from '@solana/web3.js';
import * as crypto from 'crypto';
import { LoggerService } from 'src/core/logger/logger.service';

type MonitorCallback = (signature: string, amountUsdc: number) => void;

@Injectable()
export class SolanaService implements OnModuleInit {
  private connection: Connection | null = null;
  private backupConnection: Connection | null = null;
  private readonly usdcMintAddress: string;
  private readonly heliusApiKey?: string;
  private readonly heliusWebhookUrl?: string;
  private readonly heliusWebhookSecret?: string;
  private readonly rpcUrl: string;
  private readonly backupRpcUrl?: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly logger: LoggerService,
  ) {
    this.usdcMintAddress = this.configService.getOrThrow<string>(
      'solana.usdcMintAddress',
    );
    this.heliusApiKey = this.configService.get<string>('solana.helius.apiKey');
    this.heliusWebhookUrl = this.configService.get<string>(
      'solana.helius.webhookUrl',
    );
    this.heliusWebhookSecret = this.configService.get<string>(
      'solana.helius.webhookSecret',
    );
    this.rpcUrl = this.configService.getOrThrow<string>('solana.rpcUrl');
    this.backupRpcUrl = this.configService.get<string>('solana.backupRpcUrl');
  }

  async onModuleInit() {
    await this.initialize();
  }

  initialize(): Promise<void> {
    if (!this.connection) {
      this.connection = new Connection(this.rpcUrl, 'confirmed');
      this.logger.log(`Solana connection initialized: ${this.rpcUrl}`);
    }

    if (this.backupRpcUrl && !this.backupConnection) {
      this.backupConnection = new Connection(this.backupRpcUrl, 'confirmed');
      this.logger.log(`Solana backup connection ready: ${this.backupRpcUrl}`);
    }

    return Promise.resolve();
  }

  validateAddressOrThrow(address: string): PublicKey {
    try {
      return new PublicKey(address);
    } catch {
      throw new BadRequestException('Please enter a valid Solana address.');
    }
  }

  async setupWebhook(address: string, userId: string): Promise<string> {
    if (!this.heliusApiKey || !this.heliusWebhookUrl) {
      throw new BadRequestException('Helius configuration missing.');
    }

    const response = await axios.post(
      `https://api.helius.xyz/v0/webhooks?api-key=${this.heliusApiKey}`,
      {
        webhookURL: this.heliusWebhookUrl,
        transactionTypes: ['TOKEN_TRANSFER'],
        accountAddresses: [address],
        webhookType: 'enhanced',
        authHeader: this.heliusWebhookSecret,
        // Attach metadata to help identify the user downstream if needed
        // (Helius includes this in callbacks)
        metadata: { userId },
      },
    );

    const webhookId = response.data?.webhookID ?? response.data?.id;
    if (!webhookId) {
      throw new BadRequestException('Unable to create webhook with Helius.');
    }
    return webhookId;
  }

  async removeWebhook(webhookId?: string): Promise<void> {
    if (!webhookId) {
      return;
    }
    if (!this.heliusApiKey) {
      return;
    }

    try {
      await axios.delete(
        `https://api.helius.xyz/v0/webhooks/${webhookId}?api-key=${this.heliusApiKey}`,
      );
    } catch (error) {
      this.logger.warn(
        `Failed to remove webhook ${webhookId}: ${String(error)}`,
        SolanaService.name,
      );
    }
  }

  async monitorAddressFallback(
    address: string,
    callback: MonitorCallback,
  ): Promise<number> {
    await this.initialize();
    const conn = this.connection as Connection;
    const publicKey = new PublicKey(address);

    const subscriptionId = conn.onLogs(publicKey, (log) => {
      const signature = log.signature;
      if (!signature) {
        return;
      }

      this.getUsdcTransferAmount(signature, address)
        .then((amount) => {
          if (amount > 0) {
            callback(signature, amount);
          }
        })
        .catch((error) => {
          this.logger.warn(
            `Fallback monitor parse failed for ${address}: ${String(error)}`,
            SolanaService.name,
          );
        });
    });

    return subscriptionId;
  }

  async stopMonitoring(subscriptionId: number): Promise<void> {
    await this.initialize();
    if (this.connection) {
      await this.connection.removeOnLogsListener(subscriptionId);
    }
  }

  async getUsdcBalance(address: string): Promise<number> {
    await this.initialize();
    const publicKey = new PublicKey(address);
    const conn = this.connection as Connection;

    const tokenAccounts = await conn.getParsedTokenAccountsByOwner(publicKey, {
      mint: new PublicKey(this.usdcMintAddress),
    });

    const first = tokenAccounts.value[0];
    if (!first) {
      return 0;
    }

    const amountStr =
      first.account.data.parsed?.info?.tokenAmount?.amount ?? '0';
    const decimals =
      first.account.data.parsed?.info?.tokenAmount?.decimals ?? 6;

    return Number(amountStr) / 10 ** decimals;
  }

  getUsdcMintAddress(): string {
    return this.usdcMintAddress;
  }

  async getTransaction(
    signature: string,
  ): Promise<ParsedTransactionWithMeta | null> {
    await this.initialize();
    const conn = this.connection as Connection;
    return conn.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: 'confirmed',
    });
  }

  async isTransactionConfirmed(signature: string): Promise<boolean> {
    await this.initialize();
    const conn = this.connection as Connection;
    const status = await conn.getSignatureStatus(signature, {
      searchTransactionHistory: true,
    });
    return (status.value?.confirmationStatus ?? null) !== null;
  }

  validateWebhookSignature(
    providedSignature: string | undefined,
    body: unknown,
  ): boolean {
    if (!this.heliusWebhookSecret) {
      // If no secret is configured, skip validation but log a warning
      this.logger.warn(
        'HELIUS_WEBHOOK_SECRET not set, skipping webhook signature validation.',
        SolanaService.name,
      );
      return true;
    }
    if (!providedSignature) {
      return false;
    }
    const payload = JSON.stringify(body);
    const expected = crypto
      .createHmac('sha256', this.heliusWebhookSecret)
      .update(payload)
      .digest('hex');
    return expected === providedSignature;
  }

  private async getUsdcTransferAmount(
    signature: string,
    ownerAddress: string,
  ): Promise<number> {
    const tx = await this.getTransaction(signature);
    if (!tx) {
      return 0;
    }
    return this.extractUsdcAmount(tx, ownerAddress);
  }

  private extractUsdcAmount(
    tx: ParsedTransactionWithMeta,
    ownerAddress: string,
  ): number {
    const mint = this.usdcMintAddress;
    const { meta } = tx;
    if (!meta) {
      return 0;
    }
    const pre = meta.preTokenBalances ?? [];
    const post = meta.postTokenBalances ?? [];

    const matchingPost = post.find(
      (b) => b.owner === ownerAddress && b.mint === mint,
    );
    const matchingPre = pre.find(
      (b) => b.owner === ownerAddress && b.mint === mint,
    );

    if (!matchingPost) {
      return 0;
    }

    const decimals = matchingPost.uiTokenAmount.decimals ?? 6;
    const postAmount =
      Number(matchingPost.uiTokenAmount.amount) / 10 ** decimals;
    const preAmount = matchingPre
      ? Number(matchingPre.uiTokenAmount.amount) / 10 ** decimals
      : 0;
    const delta = postAmount - preAmount;

    return delta > 0 ? delta : 0;
  }
}
