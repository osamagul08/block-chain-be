import { Body, Controller, Get, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RequestChallengeDto } from './dto/request-challenge.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtValidatedUser } from './jwt.strategy';
import { SkipAuth } from '../../common/decorators/skip-auth.decorator';
import {
  SwaggerSummary,
  SwaggerTags,
} from '../../common/constants/swagger.constants';

@ApiTags(SwaggerTags.Auth)
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('auth-request')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes
  @ApiOperation({ summary: SwaggerSummary.AuthRequestChallenge })
  async requestChallenge(@Body() dto: RequestChallengeDto) {
    return await this.authService.requestChallenge(dto);
  }

  @Post('verify')
  @SkipAuth()
  @Throttle({ default: { limit: 5, ttl: 900000 } }) // 5 requests per 15 minutes
  @ApiOperation({ summary: SwaggerSummary.AuthVerifySignature })
  async verifySignature(@Body() dto: VerifySignatureDto) {
    return await this.authService.verifySignature(dto);
  }

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: SwaggerSummary.AuthGetProfile })
  getProfile(@CurrentUser() user: JwtValidatedUser) {
    return { user };
  }
}
