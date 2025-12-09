import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
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

export class UpdateProfileDto {
  @ApiProperty({
    description: SwaggerFieldDescriptions.Username,
    example: SwaggerExamples.Username,
    minLength: 3,
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(30)
  @Matches(/^[a-z0-9._-]+$/i, {
    message:
      'username can only contain letters, numbers, dots, underscores, and hyphens',
  })
  @Transform(({ value }) => sanitizeLowercaseString(value))
  username: string;

  @ApiProperty({
    description: SwaggerFieldDescriptions.Email,
    example: SwaggerExamples.Email,
    maxLength: 254,
  })
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  @Transform(({ value }) => sanitizeString(value)?.toLowerCase())
  email: string;
}
