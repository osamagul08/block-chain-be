import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEthereumAddress,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsOptional()
  fullName?: string;

  @IsEthereumAddress()
  @IsNotEmpty()
  walletAddress: string;

  @IsEmail()
  @IsOptional()
  email?: string;
}
