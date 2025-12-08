import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { UsersService } from '../users/users.service';
import { AuthChallengeRepository } from './auth.repository';
import { RequestChallengeDto } from './dto/request-challenge.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';

interface LoginMessagePayload {
  domain: string;
  uri: string;
  chainId: number;
  walletAddress: string;
  nonce: string;
}

@Injectable()
export class AuthService {
  private readonly challengeTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly challengeRepository: AuthChallengeRepository,
  ) {}

  async requestChallenge({ walletAddress }: RequestChallengeDto) {
    const normalizedAddress = walletAddress.toLowerCase();

    await this.challengeRepository.deleteExpired(normalizedAddress);
    await this.challengeRepository.invalidateOpenChallenges(normalizedAddress);

    const nonce = randomBytes(16).toString('hex');
    const message = this.buildLoginMessage({
      domain: this.configService.get<string>(
        'auth.loginMessageDomain',
        'Wallet',
      ),
      uri: this.configService.get<string>(
        'auth.loginMessageUri',
        'http://localhost:3000',
      ),
      chainId: this.configService.get<number>('auth.chainId', 1),
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
    const challenge = await this.challengeRepository.findValidChallenge(
      normalizedAddress,
      message,
    );

    if (!challenge) {
      throw new UnauthorizedException('Challenge not found or expired.');
    }

    if (challenge.message !== message) {
      throw new UnauthorizedException('Challenge message mismatch.');
    }

    const recoveredAddress = ethers.verifyMessage(challenge.message, signature);

    if (recoveredAddress.toLowerCase() !== normalizedAddress) {
      throw new UnauthorizedException(
        'Signature does not match wallet address.',
      );
    }

    await this.challengeRepository.markUsed(challenge.id);

    const user = await this.usersService.upsertWalletUser({
      walletAddress: normalizedAddress,
    });
    await this.usersService.updateLastLogin(user.id);

    const payload = { sub: user.id, walletAddress: user.walletAddress };
    const accessToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        fullName: user.fullName,
        email: user.email,
        lastLoginAt: user.lastLoginAt,
      },
    };
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
