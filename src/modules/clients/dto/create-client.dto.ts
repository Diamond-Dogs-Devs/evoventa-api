import { IsEmail, IsString, IsMobilePhone } from 'class-validator';

export class CreateClientDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsMobilePhone()
  telephone: string;

  @IsString()
  address: string;

  @IsString()
  rfc: string;
}
