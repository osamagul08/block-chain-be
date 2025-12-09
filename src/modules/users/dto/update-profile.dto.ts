import { Transform } from 'class-transformer';
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

export class UpdateProfileDto {
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

  @IsEmail()
  @IsNotEmpty()
  @MaxLength(254)
  @Transform(({ value }) => sanitizeString(value)?.toLowerCase())
  email: string;
}
