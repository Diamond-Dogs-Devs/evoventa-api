import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { LoginUserDto, RegisterUserDto } from './dto';
import { JWTPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService extends PrismaClient {
  constructor(private readonly jwtService: JwtService) {
    super();
  }

  private readonly logger = new Logger('Auth-Service');

  async onModuleInit() {
    await this.$connect();
    this.logger.log('DB Connected');
  }

  async signJWT(payload: JWTPayload) {
    return this.jwtService.sign(payload);
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new HttpException('Invalid token', HttpStatus.UNAUTHORIZED);
    }
  }

  async registerUser(registerUserDto: RegisterUserDto) {
    const { email, password } = registerUserDto;

    const exists = await this.user.findUnique({
      where: { email },
    });

    if (exists) {
      throw new HttpException('User already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    const user = await this.user.create({
      data: {
        ...registerUserDto,
        password: hashedPassword,
      },
    });

    const { password: _, ...rest } = user;

    return {
      user: rest,
      token: await this.signJWT(rest),
    };
  }

  async loginUser(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const isValid = bcrypt.compareSync(password, user.password);

    if (!isValid) {
      throw new HttpException('Invalid credentials', HttpStatus.BAD_REQUEST);
    }

    const { password: _, ...rest } = user;

    return {
      user: rest,
      token: await this.signJWT(rest),
    };
  }
}
