import { Transform } from 'class-transformer';

export function StringToNumber() {
  return Transform(({ value }) => {
    if (typeof value === 'string') {
      const parsedValue = Number(value);
      return isNaN(parsedValue) ? value : parsedValue;
    }
    return value;
  });
}
