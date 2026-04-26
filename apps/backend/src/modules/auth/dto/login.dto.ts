import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@salon-emma.fr' })
  @IsEmail({}, { message: 'Email invalide' })
  email: string;

  @ApiProperty({ example: 'Admin1234!' })
  @IsString()
  @MinLength(8, { message: 'Mot de passe trop court' })
  @MaxLength(128, { message: 'Mot de passe trop long' })
  password: string;
}
