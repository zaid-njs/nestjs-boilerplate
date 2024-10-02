import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const Pagination = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const query = request.query;

    // Extract page and limit from query, with defaults
    const page = parseInt(query?.page, 10) || 1;
    const limit = parseInt(query?.limit, 10) || 40;

    // Calculate skip
    const skip = (page - 1) * limit;

    return { skip, limit };
  },
);
