import { Role } from '@prisma/client';
import {
  IsString,
  IsEmail,
  IsStrongPassword,
  IsMobilePhone,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { RoleList } from '../enum/role.enum';

export class CreateUserDto {
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

  @IsEnum(RoleList, { message: `Possible role values are ${RoleList}` })
  @IsOptional()
  role: Role = Role.USER;
}
