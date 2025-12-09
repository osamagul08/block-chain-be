import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly repo: Repository<Users>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Users);
  }

  async findByWalletAddress(walletAddress: string): Promise<Users | null> {
    return await this.repo.findOne({ where: { walletAddress } });
  }

  async findById(id: string): Promise<Users | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async getProfileById(id: string): Promise<Users | null> {
    return await this.repo.findOne({ where: { id } });
  }

  async updateProfile(
    id: string,
    payload: Pick<Users, 'username' | 'email'>,
  ): Promise<Users> {
    await this.repo.update(id, payload);
    const updated = await this.getProfileById(id);
    if (!updated) {
      throw new Error('User not found after update');
    }
    return updated;
  }

  async upsertByWallet(
    walletAddress: string,
    payload: Partial<Users>,
  ): Promise<Users> {
    const normalized = walletAddress.toLowerCase();
    let user = await this.findByWalletAddress(normalized);
    if (!user) {
      user = this.repo.create({ walletAddress: normalized, ...payload });
    } else {
      this.repo.merge(user, payload);
    }
    return await this.repo.save(user);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.repo.update(id, { lastLoginAt: new Date() });
  }
}
