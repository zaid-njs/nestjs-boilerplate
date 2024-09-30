import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IUser } from 'src/modules/users/entities/user.entity';

export const GetUser = createParamDecorator(
  (_data, ctx: ExecutionContext): IUser => {
    const req: Request = ctx.switchToHttp().getRequest();

    return req.user as IUser;
  },
);
