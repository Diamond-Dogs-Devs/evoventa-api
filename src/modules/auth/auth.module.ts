import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { envs } from '../../config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';

@Module({
  controllers: [AuthController],

  providers: [AuthService],

  exports: [AuthService],

  imports: [
    JwtModule.register({
      global: true,
      secret: envs.jwtKey,
      signOptions: { expiresIn: '9hr' },
    }),
  ],
})
export class AuthModule {}
