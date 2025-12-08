import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RequestChallengeDto } from './dto/request-challenge.dto';
import { VerifySignatureDto } from './dto/verify-signature.dto';

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
}
