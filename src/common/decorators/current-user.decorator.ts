import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtValidatedUser } from '../../modules/auth/strategies/jwt.strategy';

export const CurrentUser = createParamDecorator(
  (data: keyof JwtValidatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: JwtValidatedUser | undefined = request.user;

    if (!user) {
      return undefined;
    }

    return data ? user[data] : user;
  },
);
