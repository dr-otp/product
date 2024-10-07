import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { isCuid } from '@paralleldrive/cuid2'; // You can use a library like cuid

@ValidatorConstraint({ async: false })
export class IsCuidConstraint implements ValidatorConstraintInterface {
  validate(cuidValue: string): boolean {
    // If the property is not sent in the request (undefined or null), skip validation
    if (cuidValue === undefined || cuidValue === null) return true;

    // Otherwise, validate the value as a CUID
    return isCuid(cuidValue);
  }

  defaultMessage(): string {
    return 'productId must be a valid CUID';
  }
}

export function IsCuid(validationOptions?: ValidationOptions) {
  return function (object: unknown, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsCuidConstraint,
    });
  };
}
