import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../users/users.service';

interface JwtPayload {
  sub: string;
  walletAddress: string;
}

export interface JwtValidatedUser {
  id: string;
  walletAddress: string;
  fullName?: string | null;
  email?: string | null;
  lastLoginAt?: Date | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('auth.jwtSecret'),
    });
  }

  async validate(payload: JwtPayload): Promise<JwtValidatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException('User associated with token not found.');
    }

    return {
      id: user.id,
      walletAddress: user.walletAddress,
      fullName: user.fullName,
      email: user.email,
      lastLoginAt: user.lastLoginAt,
    };
  }
}
