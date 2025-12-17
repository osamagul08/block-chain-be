import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RegisterAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  solanaAddress: string;
}
