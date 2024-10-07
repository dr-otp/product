import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';
import { isCuid } from '@paralleldrive/cuid2'; // Ensure to install cuid: npm install cuid

@Injectable()
export class ParseCuidPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!isCuid(value)) throw new BadRequestException('Validation failed (CUID is expected)');

    return value;
  }
}
