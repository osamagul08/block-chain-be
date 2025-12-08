import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

export class VerifySignatureDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @IsString()
  @IsNotEmpty()
  signature: string;

  @IsString()
  @IsNotEmpty()
  nonce: string;
}
