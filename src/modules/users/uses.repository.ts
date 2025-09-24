import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Users } from './entities/user.entity';

@Injectable()
export class UsersRepository {
  private readonly repo: Repository<Users>;

  constructor(private readonly dataSource: DataSource) {
    this.repo = this.dataSource.getRepository(Users);
  }

  async createUser(userData: Partial<Users>): Promise<Users> {
    const user = this.repo.create(userData);
    return await this.repo.save(user);
  }
}
