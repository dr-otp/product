import { Controller, HttpStatus } from '@nestjs/common';
import { MessagePattern, Payload, RpcException } from '@nestjs/microservices';
import { isCuid } from '@paralleldrive/cuid2';

import { PaginationDto, User } from 'src/common';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ProductService } from './product.service';

@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @MessagePattern('product.health')
  healthCheck() {
    return 'Product service is up and running';
  }

  @MessagePattern('product.create')
  create(@Payload() payload: { createProductDto: CreateProductDto; user: User }) {
    const { createProductDto, user } = payload;
    return this.productService.create(createProductDto, user);
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

  @MessagePattern('product.find.one.code')
  findOneByCode(@Payload() payload: { code: number; user: User }) {
    const { code, user } = payload;

    if (isNaN(code))
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Invalid product code',
      });

    return this.productService.findOneByCode(code, user);
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

  @MessagePattern('product.validate')
  validateProducts(@Payload('ids') ids: string[]) {
    const invalidIds = ids.filter((id) => !isCuid(id));

    if (invalidIds.length > 0)
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: `Invalid product ids: ${invalidIds.join(', ')}`,
      });

    return this.productService.validate(ids);
  }

  @MessagePattern('product.update')
  update(@Payload() payload: { updateProductDto: UpdateProductDto; user: User }) {
    const { updateProductDto, user } = payload;
    return this.productService.update(updateProductDto, user);
  }

  @MessagePattern('product.restore')
  restore(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    return this.productService.restore(id, user);
  }

  @MessagePattern('product.remove')
  remove(@Payload() payload: { id: string; user: User }) {
    const { id, user } = payload;
    return this.productService.remove(id, user);
  }
}
