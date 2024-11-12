import { applyDecorators } from '@nestjs/common';
import { ApiQuery } from '@nestjs/swagger';

export function QueryParams(...params: string[]) {
  return applyDecorators(
    ...params.map((param) =>
      ApiQuery({ type: String, name: param, required: false }),
    ),
  );
}
