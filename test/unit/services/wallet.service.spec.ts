import { Test, TestingModule } from '@nestjs/testing';
import { WalletService } from '../../../src/modules/wallet/wallet.service';
import { ethers } from 'ethers';

describe('WalletService', () => {
  let service: WalletService;
  let jsonRpcProviderSpy: jest.SpyInstance;
  const mockProviderInstance = {
    connection: 'mock',
  } as unknown as ethers.JsonRpcProvider;

  beforeEach(async () => {
    jsonRpcProviderSpy = jest
      .spyOn(ethers, 'JsonRpcProvider')
      .mockImplementation(() => mockProviderInstance);

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [WalletService],
    }).compile();

    service = moduleRef.get(WalletService);
  });

  afterEach(() => {
    jsonRpcProviderSpy.mockRestore();
    jest.clearAllMocks();
  });

  it('returns a JsonRpcProvider for the given RPC URL', () => {
    const rpcUrl = 'https://rpc.example';
    const provider = service.getProvider(rpcUrl);

    expect(jsonRpcProviderSpy).toHaveBeenCalledWith(rpcUrl);
    expect(provider).toBe(mockProviderInstance);
  });

  it('propagates errors thrown while constructing provider', () => {
    const error = new Error('invalid RPC');
    jsonRpcProviderSpy.mockImplementation(() => {
      throw error;
    });

    expect(() => service.getProvider('https://bad-rpc')).toThrow(error);
  });
});
