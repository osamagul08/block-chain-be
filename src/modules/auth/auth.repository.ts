import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, IsNull, LessThan } from 'typeorm';
import { AuthChallenge } from './entities/auth.entity';

@Injectable()
export class AuthChallengeRepository {
  constructor(
    @InjectRepository(AuthChallenge)
    private readonly repo: Repository<AuthChallenge>,
  ) {}

  async createChallenge(data: Partial<AuthChallenge>): Promise<AuthChallenge> {
    const challenge = this.repo.create(data);
    return await this.repo.save(challenge);
  }

  async findValidChallenge(
    walletAddress: string,
    nonce: string,
  ): Promise<AuthChallenge | null> {
    return await this.repo.findOne({
      where: {
        walletAddress,
        nonce,
        expiresAt: MoreThan(new Date()),
        usedAt: IsNull(),
      },
    });
  }

  async markUsed(id: string): Promise<void> {
    await this.repo.update(id, { usedAt: new Date() });
  }

  async pruneExpired(walletAddress: string): Promise<void> {
    await this.repo.delete({
      walletAddress,
      expiresAt: LessThan(new Date()),
      usedAt: IsNull(),
    });
  }

  async invalidateOpenChallenges(walletAddress: string): Promise<void> {
    await this.repo.update(
      {
        walletAddress,
        usedAt: IsNull(),
      },
      { usedAt: new Date() },
    );
  }
}
