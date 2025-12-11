import { Injectable } from '@nestjs/common';
import { LoggerService } from '../../core/logger/logger.service';

interface FailedAttempt {
  count: number;
  firstAttemptAt: Date;
  lastAttemptAt: Date;
}

@Injectable()
export class AnomalyDetectionService {
  private readonly maxFailedAttempts = 5;
  private readonly timeWindowMs = 60 * 60 * 1000; // 1 hour
  private readonly failedAttempts = new Map<string, FailedAttempt>();

  constructor(private readonly logger: LoggerService) {}

  /**
   * Check if wallet is blocked due to too many failed attempts
   * @param walletAddress - Normalized wallet address
   * @returns true if blocked, false otherwise
   */
  isBlocked(walletAddress: string): boolean {
    const normalized = walletAddress.toLowerCase();
    const attempts = this.failedAttempts.get(normalized);

    if (!attempts) {
      return false;
    }

    // Check if time window has expired
    const now = new Date();
    const timeSinceFirstAttempt =
      now.getTime() - attempts.firstAttemptAt.getTime();

    if (timeSinceFirstAttempt > this.timeWindowMs) {
      // Time window expired, clear the attempts
      this.failedAttempts.delete(normalized);
      return false;
    }

    // Check if max attempts exceeded
    if (attempts.count >= this.maxFailedAttempts) {
      const timeUntilUnblock = this.timeWindowMs - timeSinceFirstAttempt;
      const minutesUntilUnblock = Math.ceil(timeUntilUnblock / (60 * 1000));

      this.logger.warn(
        `Wallet ${this.redactWalletAddress(normalized)} is temporarily blocked due to ${attempts.count} failed login attempts. Unblocks in ${minutesUntilUnblock} minutes.`,
        AnomalyDetectionService.name,
      );

      return true;
    }

    return false;
  }

  /**
   * Record a failed login attempt
   * @param walletAddress - Normalized wallet address
   */
  recordFailedAttempt(walletAddress: string): void {
    const normalized = walletAddress.toLowerCase();
    const now = new Date();
    const attempts = this.failedAttempts.get(normalized);

    if (attempts) {
      // Check if time window has expired
      const timeSinceFirstAttempt =
        now.getTime() - attempts.firstAttemptAt.getTime();

      if (timeSinceFirstAttempt > this.timeWindowMs) {
        // Reset if time window expired
        this.failedAttempts.set(normalized, {
          count: 1,
          firstAttemptAt: now,
          lastAttemptAt: now,
        });
      } else {
        // Increment count
        attempts.count += 1;
        attempts.lastAttemptAt = now;
        this.failedAttempts.set(normalized, attempts);
      }
    } else {
      // First failed attempt
      this.failedAttempts.set(normalized, {
        count: 1,
        firstAttemptAt: now,
        lastAttemptAt: now,
      });
    }

    const currentAttempts = this.failedAttempts.get(normalized);
    if (currentAttempts) {
      this.logger.warn(
        `Failed login attempt for wallet ${this.redactWalletAddress(normalized)}. Total attempts: ${currentAttempts.count}/${this.maxFailedAttempts}`,
        AnomalyDetectionService.name,
      );

      // Log suspicious activity if approaching limit
      if (currentAttempts.count >= 3) {
        this.logger.warn(
          `Suspicious activity detected: Wallet ${this.redactWalletAddress(normalized)} has ${currentAttempts.count} failed login attempts in the last hour.`,
          AnomalyDetectionService.name,
        );
      }
    }
  }

  /**
   * Reset failed attempts counter on successful login
   * @param walletAddress - Normalized wallet address
   */
  resetFailedAttempts(walletAddress: string): void {
    const normalized = walletAddress.toLowerCase();
    const attempts = this.failedAttempts.get(normalized);

    if (attempts && attempts.count > 0) {
      this.logger.log(
        `[${AnomalyDetectionService.name}] Resetting failed login attempts for wallet ${this.redactWalletAddress(normalized)} after successful login.`,
      );
      this.failedAttempts.delete(normalized);
    }
  }

  /**
   * Get current failed attempts count for a wallet
   * @param walletAddress - Normalized wallet address
   * @returns Number of failed attempts in current time window
   */
  getFailedAttemptsCount(walletAddress: string): number {
    const normalized = walletAddress.toLowerCase();
    const attempts = this.failedAttempts.get(normalized);

    if (!attempts) {
      return 0;
    }

    // Check if time window has expired
    const now = new Date();
    const timeSinceFirstAttempt =
      now.getTime() - attempts.firstAttemptAt.getTime();

    if (timeSinceFirstAttempt > this.timeWindowMs) {
      this.failedAttempts.delete(normalized);
      return 0;
    }

    return attempts.count;
  }

  /**
   * Redact wallet address for logging (show only last 6 chars)
   * @param walletAddress - Full wallet address
   * @returns Redacted wallet address
   */
  private redactWalletAddress(walletAddress: string): string {
    if (!walletAddress || walletAddress.length < 6) {
      return '***';
    }
    return `***${walletAddress.slice(-6)}`;
  }
}
