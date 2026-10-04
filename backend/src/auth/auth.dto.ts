import { IsEmail, IsString, Length, MaxLength } from "class-validator";

export class RegisterDto {
  @IsEmail() email: string;
  @IsString() @Length(2, 120) displayName: string;
  @IsString() @Length(12, 200) password: string;
}

export class LoginDto {
  @IsEmail() email: string;
  @IsString() @MaxLength(200) password: string;
}
