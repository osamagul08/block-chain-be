import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UsersRepository } from './uses.repository';
import { Users } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

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

  async getProfileById(id: string): Promise<Users> {
    const profile = await this.usersRepository.getProfileById(id);

    if (!profile) {
      throw new NotFoundException('User not found');
    }

    return profile;
  }

  async updateProfile(id: string, payload: UpdateProfileDto): Promise<Users> {
    try {
      return await this.usersRepository.updateProfile(id, payload);
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Username or email already in use');
      }
      throw error;
    }
  }

  private isUniqueConstraintError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    const code = (error as { code?: unknown }).code;
    const number = (error as { number?: unknown }).number;

    return (
      code === '23505' ||
      code === 'ER_DUP_ENTRY' ||
      code === 'SQLITE_CONSTRAINT_UNIQUE' ||
      number === 2627 ||
      number === 2601
    );
  }
}
