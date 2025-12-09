import { Body, Controller, Get, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import {
  SwaggerDescriptions,
  SwaggerSummary,
  SwaggerTags,
} from '../../common/constants/swagger.constants';
import { UsersService } from './users.service';
import { LoggerService } from 'src/core/logger/logger.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { Users } from './entities/user.entity';

@ApiTags(SwaggerTags.Profile)
@ApiBearerAuth()
@Controller('user')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly logger: LoggerService,
  ) {}

  @Get()
  @ApiOperation({ summary: SwaggerSummary.ProfileGet })
  @ApiOkResponse({
    description: SwaggerDescriptions.ProfileGetSuccess,
    type: Users,
  })
  async getProfile(@CurrentUser('id') userId: string): Promise<Users> {
    this.logger.log(`Fetching profile for user: ${userId}`);
    return await this.usersService.getProfileById(userId);
  }

  @Put()
  @ApiOperation({ summary: SwaggerSummary.ProfileUpdate })
  @ApiOkResponse({
    description: SwaggerDescriptions.ProfileUpdateSuccess,
    type: Users,
  })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() payload: UpdateProfileDto,
  ): Promise<Users> {
    this.logger.log(`Updating profile for user: ${userId}`);
    return await this.usersService.updateProfile(userId, payload);
  }
}
