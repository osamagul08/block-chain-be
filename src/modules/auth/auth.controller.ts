import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestChallengeDto } from './dto/request-challenge.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtValidatedUser } from './strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('challenge')
  async requestChallenge(@Body() dto: RequestChallengeDto) {
    return await this.authService.requestChallenge(dto);
  }

  @Post('verify')
  async verifySignature(@Body() dto: VerifySignatureDto) {
    return await this.authService.verifySignature(dto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@CurrentUser() user: JwtValidatedUser) {
    return { user };
  }
}
