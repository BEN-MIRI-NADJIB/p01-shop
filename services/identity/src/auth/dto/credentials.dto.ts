import { IsEmail, MinLength } from 'class-validator';

export class CredentialsDto {
  @IsEmail() email: string;
  @MinLength(12) password: string;
}