import { IsDecimal, IsNotEmpty, IsPositive, Min } from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @Min(3)
  name: string;

  @IsPositive()
  @IsDecimal({ decimal_digits: '8' })
  price: number;
}
