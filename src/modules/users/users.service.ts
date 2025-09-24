import { Injectable } from '@nestjs/common';
import { UsersRepository } from './uses.repository';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async createUser(userData: Partial<Users>): Promise<Users> {
    return await this.usersRepository.createUser(userData);
  }
}
