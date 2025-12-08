import { IsEthereumAddress, IsNotEmpty } from 'class-validator';

export class RequestChallengeDto {
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;
}
