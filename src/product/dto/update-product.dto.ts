import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';
import { IsCuid } from 'src/common';

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @IsCuid()
  id: string;
}
