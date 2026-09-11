import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';

import { AuthService } from './auth.service';

import {
  AuthGuard,
  CurrentUser,
  GetToken,
  GetUser,
  Roles,
  RolesGuard,
} from '../../common';
import { LoginUserDto, RegisterUserDto } from './dto';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @UseGuards(AuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  registerUser(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.registerUser(registerUserDto);
  }

  @Post('login')
  loginUser(@Body() loginUserDto: LoginUserDto) {
    return this.authService.loginUser(loginUserDto);
  }

  @UseGuards(AuthGuard)
  @Get('verifyToken')
  verifyToken(@GetUser() user: CurrentUser, @GetToken() token: string) {
    return [user, token];
  }
}
