import {
  ValidationOptions,
  registerDecorator,
  ValidationArguments,
} from 'class-validator';

export function IsBetween(
  min: number,
  max: number,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isBetween',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [min, max],
      validator: {
        validate(value: number, args: ValidationArguments) {
          const [minValue, maxValue] = args.constraints;
          return (
            typeof value === 'number' && value >= minValue && value <= maxValue
          );
        },
        defaultMessage(args: ValidationArguments) {
          const [minValue, maxValue] = args.constraints;
          return `${args.property} must be between ${minValue} and ${maxValue}`;
        },
      },
    });
  };
}
