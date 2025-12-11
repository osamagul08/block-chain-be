import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEthereumAddress,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import {
  sanitizeLowercaseString,
  sanitizeString,
} from '../../../common/utils/sanitize.util';
import {
  SwaggerExamples,
  SwaggerFieldDescriptions,
} from '../../../common/constants/swagger.constants';

export class CreateUserDto {
  @ApiProperty({
    description: SwaggerFieldDescriptions.FullName,
    example: SwaggerExamples.FullName,
    required: false,
    maxLength: 80,
  })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  @Transform(({ value }) => sanitizeString(value))
  fullName?: string;

  @ApiProperty({
    description: SwaggerFieldDescriptions.Username,
    example: SwaggerExamples.Username,
    required: false,
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @IsOptional()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9._-]+$/i, {
    message:
      'username can only contain letters, numbers, dots, underscores, and hyphens',
  })
  @Transform(({ value }) => sanitizeLowercaseString(value))
  username?: string;

  @ApiProperty({
    description: SwaggerFieldDescriptions.WalletAddress,
    example: SwaggerExamples.WalletAddress,
  })
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @ApiProperty({
    description: SwaggerFieldDescriptions.Email,
    example: SwaggerExamples.Email,
    required: false,
  })
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => sanitizeString(value)?.toLowerCase())
  email?: string;
}
