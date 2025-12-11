import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { UsersService } from '../users/users.service';
import { AuthChallengeRepository } from './auth.repository';
import { RequestChallengeDto } from './dto/request-challenge.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';
import { AuthConfigDefaults } from '../../common/constants/config.constants';
import { AnomalyDetectionService } from './anomaly-detection.service';

interface LoginMessagePayload {
  domain: string;
  uri: string;
  chainId: number;
  walletAddress: string;
  nonce: string;
}

@Injectable()
export class AuthService {
  private readonly challengeTtlMs = AuthConfigDefaults.ChallengeTtlMs;

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly challengeRepository: AuthChallengeRepository,
    private readonly anomalyDetection: AnomalyDetectionService,
  ) {}

  async requestChallenge({ walletAddress }: RequestChallengeDto) {
    const normalizedAddress = walletAddress.toLowerCase();

    await this.challengeRepository.deleteExpired(normalizedAddress);
    await this.challengeRepository.invalidateOpenChallenges(normalizedAddress);

    const nonce = randomBytes(16).toString('hex');
    const message = this.buildLoginMessage({
      domain: this.configService.get<string>(
        'auth.loginMessageDomain',
        AuthConfigDefaults.MessageDomain,
      ),
      uri: this.configService.get<string>(
        'auth.loginMessageUri',
        AuthConfigDefaults.MessageUri,
      ),
      chainId: this.configService.get<number>(
        'auth.chainId',
        AuthConfigDefaults.ChainId,
      ),
      walletAddress: normalizedAddress,
      nonce,
    });

    const expiresAt = new Date(Date.now() + this.challengeTtlMs);

    await this.challengeRepository.createChallenge({
      walletAddress: normalizedAddress,
      nonce,
      message,
      expiresAt,
    });

    return {
      walletAddress: normalizedAddress,
      nonce,
      message,
      expiresAt,
    };
  }

  async verifySignature({
    walletAddress,
    signature,
    message,
  }: VerifySignatureDto) {
    const normalizedAddress = walletAddress.toLowerCase();

    // Check if wallet is blocked due to too many failed attempts
    if (this.anomalyDetection.isBlocked(normalizedAddress)) {
      throw new ForbiddenException(
        'Too many failed login attempts. Please try again later.',
      );
    }

    try {
      const challenge = await this.challengeRepository.findValidChallenge(
        normalizedAddress,
        message,
      );

      if (!challenge) {
        this.anomalyDetection.recordFailedAttempt(normalizedAddress);
        throw new UnauthorizedException('Challenge not found or expired.');
      }

      if (challenge.message !== message) {
        this.anomalyDetection.recordFailedAttempt(normalizedAddress);
        throw new UnauthorizedException('Challenge message mismatch.');
      }

      const recoveredAddress = ethers.verifyMessage(
        challenge.message,
        signature,
      );

      if (recoveredAddress.toLowerCase() !== normalizedAddress) {
        this.anomalyDetection.recordFailedAttempt(normalizedAddress);
        throw new UnauthorizedException(
          'Signature does not match wallet address.',
        );
      }

      // All checks passed - successful login
      await this.challengeRepository.markUsed(challenge.id);

      const user = await this.usersService.upsertWalletUser({
        walletAddress: normalizedAddress,
      });
      await this.usersService.updateLastLogin(user.id);

      // Reset failed attempts on successful login
      this.anomalyDetection.resetFailedAttempts(normalizedAddress);

      const payload = { sub: user.id, walletAddress: user.walletAddress };
      const accessToken = await this.jwtService.signAsync(payload);

      return {
        accessToken,
        user: {
          id: user.id,
          walletAddress: user.walletAddress,
          email: user.email,
          lastLoginAt: user.lastLoginAt,
        },
      };
    } catch (error) {
      // If it's already an UnauthorizedException, it was already recorded
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      // For any other unexpected errors, record as failed attempt
      this.anomalyDetection.recordFailedAttempt(normalizedAddress);
      throw error;
    }
  }

  private buildLoginMessage({
    domain,
    uri,
    chainId,
    walletAddress,
    nonce,
  }: LoginMessagePayload): string {
    if (!domain || !uri) {
      throw new BadRequestException(
        'Authentication message configuration missing.',
      );
    }

    return (
      `Sign in to ${domain}\n` +
      `URI: ${uri}\n` +
      `Wallet: ${walletAddress}\n` +
      `Chain ID: ${chainId}\n` +
      `Nonce: ${nonce}`
    );
  }
}
