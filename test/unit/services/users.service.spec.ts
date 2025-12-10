import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../../src/modules/users/users.service';
import { UsersRepository } from '../../../src/modules/users/uses.repository';

const mockUsersRepository = () => ({
  upsertByWallet: jest.fn(),
  findByWalletAddress: jest.fn(),
  findById: jest.fn(),
  getProfileById: jest.fn(),
  updateProfile: jest.fn(),
  updateLastLogin: jest.fn(),
});

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: ReturnType<typeof mockUsersRepository>;

  beforeEach(async () => {
    usersRepository = mockUsersRepository();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UsersRepository, useValue: usersRepository },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('upserts a wallet user using normalized address', async () => {
    const user = { id: '1', walletAddress: '0xabc' };
    usersRepository.upsertByWallet.mockResolvedValue(user);

    const result = await service.upsertWalletUser({
      walletAddress: '0xABC',
    } as unknown as Parameters<typeof service.upsertWalletUser>[0]);

    expect(usersRepository.upsertByWallet).toHaveBeenCalledWith('0xABC', {});
    expect(result).toBe(user);
  });

  it('finds a user by wallet address after normalization', async () => {
    const user = { id: '1', walletAddress: '0xabc' };
    usersRepository.findByWalletAddress.mockResolvedValue(user);

    const result = await service.findByWalletAddress('0xABC');

    expect(usersRepository.findByWalletAddress).toHaveBeenCalledWith('0xabc');
    expect(result).toBe(user);
  });

  it('returns user by id', async () => {
    const user = { id: '2' };
    usersRepository.findById.mockResolvedValue(user);

    const result = await service.findById('2');

    expect(usersRepository.findById).toHaveBeenCalledWith('2');
    expect(result).toBe(user);
  });

  describe('getProfileById', () => {
    it('returns user profile when found', async () => {
      const profile = { id: '3' };
      usersRepository.getProfileById.mockResolvedValue(profile);

      const result = await service.getProfileById('3');

      expect(usersRepository.getProfileById).toHaveBeenCalledWith('3');
      expect(result).toBe(profile);
    });

    it('throws NotFoundException when profile missing', async () => {
      usersRepository.getProfileById.mockResolvedValue(null);

      await expect(service.getProfileById('missing')).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  it('updates last login timestamp', async () => {
    usersRepository.updateLastLogin.mockResolvedValue(undefined);

    await service.updateLastLogin('4');

    expect(usersRepository.updateLastLogin).toHaveBeenCalledWith('4');
  });

  describe('updateProfile', () => {
    it('returns updated profile when repository succeeds', async () => {
      const updated = { id: '5', email: 'user@test.com' };
      usersRepository.updateProfile.mockResolvedValue(updated);

      const result = await service.updateProfile('5', {
        email: 'user@test.com',
        username: 'user',
      });

      expect(usersRepository.updateProfile).toHaveBeenCalledWith('5', {
        email: 'user@test.com',
        username: 'user',
      });
      expect(result).toBe(updated);
    });

    it('throws ConflictException when unique constraint error occurs', async () => {
      const error = { code: '23505' };
      usersRepository.updateProfile.mockRejectedValue(error);

      await expect(
        service.updateProfile('6', {
          email: 'taken@test.com',
          username: 'taken',
        }),
      ).rejects.toThrow(
        new ConflictException('Username or email already in use'),
      );
    });

    it('rethrows unexpected errors from repository', async () => {
      const error = new Error('database down');
      usersRepository.updateProfile.mockRejectedValue(error);

      await expect(
        service.updateProfile('7', {
          email: 'any@test.com',
          username: 'any',
        }),
      ).rejects.toThrow(error);
    });
  });
});
