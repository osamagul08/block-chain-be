import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthChallenge } from './entities/auth.entity';
import { AuthChallengeRepository } from './auth.repository';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    UsersModule,
    TypeOrmModule.forFeature([AuthChallenge]),
    JwtModule.registerAsync({
      useFactory: () => ({}),
    }),
  ],
  providers: [AuthService, AuthChallengeRepository, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
