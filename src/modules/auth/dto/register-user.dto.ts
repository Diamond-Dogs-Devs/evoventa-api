import {
  IsString,
  IsEmail,
  IsStrongPassword,
  IsMobilePhone,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Role, RoleList } from '../enum/role.enum';

export class RegisterUserDto {
  @IsString()
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  employeeNumber!: string;

  @IsMobilePhone()
  telephone!: string;

  @IsStrongPassword()
  password!: string;

  @IsEnum(Role, { message: `Possible role values are ${RoleList}` })
  @IsOptional()
  role: Role = Role.USER;
}
