import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { ethers } from 'ethers';
import { AuthService } from '../../../src/modules/auth/auth.service';
import { UsersService } from '../../../src/modules/users/users.service';
import { AuthChallengeRepository } from '../../../src/modules/auth/auth.repository';
import { AuthConfigDefaults } from '../../../src/common/constants/config.constants';

jest.mock('crypto', () => {
  const actual = jest.requireActual('crypto');
  return {
    ...actual,
    randomBytes: jest.fn(),
  };
});

const randomBytesMock = crypto.randomBytes as jest.MockedFunction<
  typeof crypto.randomBytes
>;

describe('AuthService', () => {
  let service: AuthService;
  let configService: { get: jest.Mock };
  let jwtService: { signAsync: jest.Mock };
  let usersService: {
    upsertWalletUser: jest.Mock;
    updateLastLogin: jest.Mock;
  };
  let challengeRepository: {
    createChallenge: jest.Mock;
    deleteExpired: jest.Mock;
    invalidateOpenChallenges: jest.Mock;
    findValidChallenge: jest.Mock;
    markUsed: jest.Mock;
  };

  beforeEach(async () => {
    configService = {
      get: jest.fn((_key: string, defaultValue?: unknown) => defaultValue),
    };
    jwtService = {
      signAsync: jest.fn(),
    };
    usersService = {
      upsertWalletUser: jest.fn(),
      updateLastLogin: jest.fn(),
    };
    challengeRepository = {
      createChallenge: jest.fn(),
      deleteExpired: jest.fn(),
      invalidateOpenChallenges: jest.fn(),
      findValidChallenge: jest.fn(),
      markUsed: jest.fn(),
    };

    randomBytesMock.mockReset();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: ConfigService, useValue: configService },
        { provide: JwtService, useValue: jwtService },
        { provide: UsersService, useValue: usersService },
        { provide: AuthChallengeRepository, useValue: challengeRepository },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestChallenge', () => {
    it('generates and persists a challenge for the normalized wallet address', async () => {
      //arrange
      const now = new Date('2024-01-01T00:00:00.000Z');
      const dateSpy = jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
      randomBytesMock.mockImplementation((size: number): Buffer => {
        expect(size).toBe(16);
        return Buffer.from('0123456789abcdef0123456789abcdef', 'hex');
      });

      configService.get.mockImplementation((key: string, defaultValue) => {
        switch (key) {
          case 'auth.loginMessageDomain':
            return 'auth.example';
          case 'auth.loginMessageUri':
            return 'http://localhost:3000';
          case 'auth.chainId':
            return 31337;
          default:
            return defaultValue;
        }
      });
      //act
      const result = await service.requestChallenge({
        walletAddress: '0xABCDEF',
      });

      //assert
      const expectedNonce = '0123456789abcdef0123456789abcdef';
      const expectedExpiresAt = new Date(
        now.getTime() + AuthConfigDefaults.ChallengeTtlMs,
      );

      expect(challengeRepository.deleteExpired).toHaveBeenCalledWith(
        '0xabcdef',
      );
      expect(challengeRepository.invalidateOpenChallenges).toHaveBeenCalledWith(
        '0xabcdef',
      );
      expect(challengeRepository.createChallenge).toHaveBeenCalledWith(
        expect.objectContaining({
          walletAddress: '0xabcdef',
          nonce: expectedNonce,
          message: expect.stringContaining('Sign in to auth.example'),
          expiresAt: expectedExpiresAt,
        }),
      );
      expect(result).toEqual({
        walletAddress: '0xabcdef',
        nonce: expectedNonce,
        message: expect.stringContaining('http://localhost:3000'),
        expiresAt: expectedExpiresAt,
      });

      dateSpy.mockRestore();
    });

    it('throws BadRequestException when login message configuration is missing', async () => {
      randomBytesMock.mockImplementation((size: number): Buffer => {
        expect(size).toBe(16);
        return Buffer.from('0123456789abcdef0123456789abcdef', 'hex');
      });
      configService.get.mockImplementation((key: string, defaultValue) => {
        if (key === 'auth.loginMessageDomain') {
          return '';
        }
        if (key === 'auth.loginMessageUri') {
          return '';
        }
        return defaultValue;
      });

      await expect(
        service.requestChallenge({ walletAddress: '0x123' }),
      ).rejects.toThrow(
        new BadRequestException(
          'Authentication message configuration missing.',
        ),
      );
      expect(challengeRepository.createChallenge).not.toHaveBeenCalled();
    });
  });

  describe('verifySignature', () => {
    const payload = {
      walletAddress: '0xAbC',
      signature: 'signature',
      message: 'expected-message',
    };
    let verifyMessageSpy: jest.SpyInstance;

    beforeEach(() => {
      verifyMessageSpy = jest.spyOn(ethers, 'verifyMessage');
      verifyMessageSpy.mockReturnValue('0xabc');
      challengeRepository.findValidChallenge.mockResolvedValue({
        id: 'challenge-id',
        message: 'expected-message',
      });
      usersService.upsertWalletUser.mockResolvedValue({
        id: 'user-id',
        walletAddress: '0xabc',
        email: 'user@test.com',
        lastLoginAt: new Date('2024-02-02T00:00:00.000Z'),
      });
      jwtService.signAsync.mockResolvedValue('signed-token');
      challengeRepository.markUsed.mockResolvedValue(undefined);
      usersService.updateLastLogin.mockResolvedValue(undefined);
      jest.spyOn(ethers, 'verifyMessage').mockReturnValue('0xabc');
    });

    it('verifies signature and returns access token with user', async () => {
      const result = await service.verifySignature(payload);

      expect(challengeRepository.findValidChallenge).toHaveBeenCalledWith(
        '0xabc',
        'expected-message',
      );
      expect(ethers.verifyMessage).toHaveBeenCalledWith(
        'expected-message',
        'signature',
      );
      expect(challengeRepository.markUsed).toHaveBeenCalledWith('challenge-id');
      expect(usersService.upsertWalletUser).toHaveBeenCalledWith({
        walletAddress: '0xabc',
      });
      expect(usersService.updateLastLogin).toHaveBeenCalledWith('user-id');
      expect(jwtService.signAsync).toHaveBeenCalledWith({
        sub: 'user-id',
        walletAddress: '0xabc',
      });
      expect(result).toEqual({
        accessToken: 'signed-token',
        user: {
          id: 'user-id',
          walletAddress: '0xabc',
          email: 'user@test.com',
          lastLoginAt: new Date('2024-02-02T00:00:00.000Z'),
        },
      });
    });

    it('throws when challenge is not found', async () => {
      challengeRepository.findValidChallenge.mockResolvedValueOnce(null);

      await expect(service.verifySignature(payload)).rejects.toThrow(
        new UnauthorizedException('Challenge not found or expired.'),
      );
      expect(challengeRepository.markUsed).not.toHaveBeenCalled();
    });

    it('throws when challenge message mismatches', async () => {
      challengeRepository.findValidChallenge.mockResolvedValueOnce({
        id: 'challenge-id',
        message: 'different-message',
      });

      await expect(service.verifySignature(payload)).rejects.toThrow(
        new UnauthorizedException('Challenge message mismatch.'),
      );
      expect(challengeRepository.markUsed).not.toHaveBeenCalled();
    });

    it('throws when recovered address does not match wallet address', async () => {
      verifyMessageSpy.mockReturnValueOnce('0x999');

      await expect(service.verifySignature(payload)).rejects.toThrow(
        new UnauthorizedException('Signature does not match wallet address.'),
      );
      expect(challengeRepository.markUsed).not.toHaveBeenCalled();
    });
  });
});
