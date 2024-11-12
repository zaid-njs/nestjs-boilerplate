import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsString } from 'class-validator';

export const TransformString = () => {
  return applyDecorators(
    Transform(({ value }) => {
      if (Array.isArray(value)) {
        return value.map((item) => item.toLowerCase());
      }
      if (typeof value === 'string') {
        return value.toLowerCase().replace(/\s+/g, '-');
      }
      return value;
    }),
    IsString({
      each: true,
    }),
  );
};
