import { ApiProperty } from '@nestjs/swagger';
import { IsEthereumAddress, IsNotEmpty, IsString } from 'class-validator';

import {
  SwaggerExamples,
  SwaggerFieldDescriptions,
} from '../../../common/constants/swagger.constants';

export class VerifySignatureDto {
  @ApiProperty({
    description: SwaggerFieldDescriptions.WalletAddress,
    example: SwaggerExamples.WalletAddress,
  })
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({
    description: SwaggerFieldDescriptions.WalletSignature,
    example: SwaggerExamples.Signature,
  })
  @IsString()
  @IsNotEmpty()
  signature: string;

  @ApiProperty({
    description: SwaggerFieldDescriptions.LoginMessage,
    example: SwaggerExamples.LoginMessage,
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
