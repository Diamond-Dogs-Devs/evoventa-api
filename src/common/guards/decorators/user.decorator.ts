// get-user.decorator.ts

import {
  createParamDecorator,
  ExecutionContext,
  InternalServerErrorException,
} from '@nestjs/common';

export const GetUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest() as any;

    if (!request.user) {
      throw new InternalServerErrorException(
        'User not found in request (AuthGuard called?)',
      );
    }

    return request.user;
  },
);
