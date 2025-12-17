import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

import {
  SwaggerExamples,
  SwaggerFieldDescriptions,
} from '../../../common/constants/swagger.constants';

export class RequestChallengeDto {
  @ApiProperty({
    description: SwaggerFieldDescriptions.AuthWalletAddress,
    example: SwaggerExamples.WalletAddress,
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty()
  walletAddress: string;
}
