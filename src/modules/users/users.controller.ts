import { Body, Controller, Post } from '@nestjs/common';
import { UsersService } from './users.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Users } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: LoggerService,
  ) {}

  @Post('signup')
  async createUser(@Body() userData: CreateUserDto): Promise<Users> {
    this.logger.log('Creating user with data:');
    return await this.usersService.createUser(userData);
  }
}
