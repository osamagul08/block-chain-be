import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtModuleOptions, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { AuthChallenge } from './entities/auth.entity';
import { AuthChallengeRepository } from './auth.repository';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { AnomalyDetectionService } from './anomaly-detection.service';

@Module({
  imports: [
    PassportModule,
    ConfigModule,
    UsersModule,
    TypeOrmModule.forFeature([AuthChallenge]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtModuleOptions => {
        const expiresInConfig = configService.get<string>('auth.jwtExpiresIn');
        const signOptions: JwtSignOptions = {
          expiresIn: (expiresInConfig ?? '15m') as JwtSignOptions['expiresIn'],
        };

        return {
          secret: configService.getOrThrow<string>('auth.jwtSecret'),
          signOptions,
        };
      },
    }),
  ],
  providers: [
    AuthService,
    AuthChallengeRepository,
    JwtStrategy,
    AnomalyDetectionService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
