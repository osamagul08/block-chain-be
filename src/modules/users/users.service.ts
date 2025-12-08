import { Injectable } from '@nestjs/common';
import { UsersRepository } from './uses.repository';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async upsertWalletUser(userData: CreateUserDto): Promise<Users> {
    const { walletAddress, ...profile } = userData;
    return await this.usersRepository.upsertByWallet(walletAddress, profile);
  }

  async findByWalletAddress(walletAddress: string): Promise<Users | null> {
    return await this.usersRepository.findByWalletAddress(
      walletAddress.toLowerCase(),
    );
  }

  async findById(id: string): Promise<Users | null> {
    return await this.usersRepository.findById(id);
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.usersRepository.updateLastLogin(id);
  }
}
