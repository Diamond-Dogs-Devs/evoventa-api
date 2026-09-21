import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
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
import { Response } from 'express';
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
  async loginUser(
    @Body() loginUserDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const data = await this.authService.loginUser(loginUserDto);
    response.status(200).cookie('access_token', data.token, {
      httpOnly: true,
      //secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24,
    });
    return data;
  }

  @UseGuards(AuthGuard)
  @Post('verifyToken')
  verifyToken(@GetToken() token: string) {
    return this.authService.verifyToken(token);
  }
}
