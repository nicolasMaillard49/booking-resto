import { IsEmail, IsString, Length } from 'class-validator';

export class CreateMessageDto {
  @IsString() @Length(2, 80) name!: string;
  @IsEmail() email!: string;
  @IsString() @Length(1, 2000) message!: string;
  @IsString() captchaToken!: string;
  @IsString() captchaAnswer!: string;
}
