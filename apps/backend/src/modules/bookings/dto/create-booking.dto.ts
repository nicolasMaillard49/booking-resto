import { IsEmail, IsInt, IsISO8601, IsOptional, IsString, Length, Matches, Max, Min } from 'class-validator';

export class CreateBookingDto {
  @IsInt() @Min(1) @Max(50)
  partySize!: number;

  @IsISO8601()
  date!: string;

  @IsString() @Length(2, 80)
  clientName!: string;

  @IsEmail()
  clientEmail!: string;

  @IsString() @Matches(/^[+0-9 .()-]{6,20}$/, { message: 'Téléphone invalide' })
  clientPhone!: string;

  @IsOptional() @IsString() @Length(0, 500)
  notes?: string;
}
