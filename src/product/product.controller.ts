import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { isCuid } from '@paralleldrive/cuid2';

import { PaginationDto, User } from 'src/common';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern('product.create')
  create(@Payload() createProductDto: CreateProductDto) {
    return this.productService.create(createProductDto);
  }

  @MessagePattern('product.find.all')
  findAll(@Payload() payload: { pagination: PaginationDto; user: User }) {
    const { pagination, user } = payload;
    return this.productService.findAll(pagination, user);
  }

  @MessagePattern('product.find.all.summary')
  findAllSummary(@Payload() payload: { pagination: PaginationDto; user: User }) {
    const { pagination, user } = payload;
    return this.productService.findAllSummary(pagination, user);
  }

  @MessagePattern('product.find.one')
  findOne(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;

    if (!isCuid(id))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid customer id',
      });

    return this.productService.findOne(id, user);
  }

  @MessagePattern('product.find.one.summary')
  findOneSummary(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;

    if (!isCuid(id))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid customer id',
      });

    return this.productService.findOneSummary(id, user);
  }

  @MessagePattern('product.update')
  update(@Payload() payload: { updateProductDto: UpdateProductDto; user: User }) {
    const { updateProductDto, user } = payload;
    return this.productService.update(updateProductDto, user);
  }

  @MessagePattern('product.restore')
  restore(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    return this.productService.remove(id, user);
  }

  @MessagePattern('product.remove')
  remove(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    return this.productService.remove(id, user);
  }
}
