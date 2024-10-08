import { HttpStatus, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { PrismaClient, Product } from '@prisma/client';
import { firstValueFrom } from 'rxjs';

import { ListResponse, PaginationDto, Role, User, UserSummary } from 'src/common';
import { NATS_SERVICE } from 'src/config';
import { hasRoles } from 'src/helpers';
import { CreateProductDto, UpdateProductDto } from './dto';

@Injectable()
export class ProductService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(ProductService.name);

  constructor(@Inject(NATS_SERVICE) private readonly client: ClientProxy) {
    super();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log('Connected to the database \\(^.^)/');
  }

  async create(createProductDto: CreateProductDto, user: User): Promise<Partial<Product>> {
    const price = parseFloat(createProductDto.price);

    if (isNaN(price)) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Invalid price' });

    if (price <= 0) throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: 'Price must be greater than 0' });

    return this.product.create({ data: { ...createProductDto, createdById: user.id } });
  }

  async findAll(pagination: PaginationDto, user: User): Promise<ListResponse<Product>> {
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? {} : { deletedAt: null };
    const total = await this.product.count({ where });
    const lastPage = Math.ceil(total / limit);

    const data = await this.product.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where,
      orderBy: { createdAt: 'desc' },
    });

    const computedData = await this.getUsers(data);

    return { meta: { total, page, lastPage }, data: computedData };
  }

  async findAllSummary(pagination: PaginationDto, user: User): Promise<ListResponse<Product>> {
    const { page, limit } = pagination;
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? {} : { deletedAt: null };
    const total = await this.product.count({ where });
    const lastPage = Math.ceil(total / limit);

    const data = await this.product.findMany({
      take: limit,
      skip: (page - 1) * limit,
      where,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, price: true, code: true, createdAt: true },
    });

    const computedData = await this.getUsers(data);

    return { meta: { total, page, lastPage }, data: computedData };
  }

  async validate(ids: string[]): Promise<Partial<Product>[]> {
    const idsSet = Array.from(new Set(ids));

    const products = await this.product.findMany({
      where: { id: { in: idsSet } },
      select: { id: true, name: true, code: true },
    });

    if (products.length !== ids.length)
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Invalid product IDs',
      });

    return products;
  }

  async findOne(id: string, user: User): Promise<Partial<Product>> {
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? { id } : { id, deletedAt: null };

    const product = await this.product.findFirst({ where });

    if (!product) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Product with id ${id} not found` });

    const [computedProduct] = await this.getUsers([product]);

    return computedProduct;
  }

  async findOneByCode(code: number, user: User): Promise<Partial<Product>> {
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? { code } : { code, deletedAt: null };

    const product = await this.product.findFirst({ where });

    if (!product)
      throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Product with code ${code} not found` });

    const [computedProduct] = await this.getUsers([product]);

    return computedProduct;
  }

  async findOneSummary(id: string, user: User): Promise<Partial<Product>> {
    const isAdmin = hasRoles(user.roles, [Role.Admin]);

    const where = isAdmin ? { id } : { id, deletedAt: null };

    const product = await this.product.findFirst({
      where,
      select: { id: true, name: true, price: true, code: true, createdAt: true },
    });

    if (!product) throw new RpcException({ status: HttpStatus.NOT_FOUND, message: `Product with id ${id} not found` });

    return product;
  }

  async update(updateProductDto: UpdateProductDto, user: User): Promise<Partial<Product>> {
    const { id, ...rest } = updateProductDto;

    await this.findOneSummary(id, user);

    const updatedProduct = await this.product.update({ where: { id }, data: { ...rest, updatedById: user.id } });

    const [computedProduct] = await this.getUsers([updatedProduct]);

    return computedProduct;
  }

  async restore(id: string, user: User): Promise<Partial<Product>> {
    try {
      const product = await this.findOne(id, user);

      if (!product.deletedAt)
        throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: `Product with id ${id} is not deleted` });

      const updatedProduct = await this.product.update({
        where: { id },
        data: { deletedAt: null, updatedById: user.id, deletedById: null },
      });

      const [computedProduct] = await this.getUsers([updatedProduct]);

      return computedProduct;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to restore customer',
      });
    }
  }

  async remove(id: string, user: User): Promise<Partial<Product>> {
    try {
      const product = await this.findOne(id, user);

      if (product.deletedAt)
        throw new RpcException({ status: HttpStatus.BAD_REQUEST, message: `Product with id ${id} is already deleted` });

      const deletedProduct = await this.product.update({
        where: { id },
        data: { deletedAt: new Date(), deletedById: user.id },
      });

      const [computedProduct] = await this.getUsers([deletedProduct]);

      return computedProduct;
    } catch (error) {
      this.logger.error(error);
      throw new RpcException({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Failed to delete product',
      });
    }
  }

  private async getUsers(products: Partial<Product>[]): Promise<Partial<Product>[]> {
    // Collect all unique user IDs
    const ids = [
      ...new Set(products.flatMap((product) => [product.createdById, product.updatedById, product.deletedById])),
    ].filter((id): id is string => !!id);

    if (ids.length === 0) return products;

    // Fetch all users
    let users: UserSummary[];

    try {
      users = await firstValueFrom(this.client.send<UserSummary[]>('users.find.summary.batch', { ids: ids }));
    } catch (error) {
      this.logger.error('Error fetching user data:', error);
      throw error;
    }

    const userMap = new Map(users.map((user) => [user.id, user]));

    // Map users to products
    return products.map(({ createdById, updatedById, deletedById, ...rest }) => ({
      ...rest,
      createdBy: createdById ? userMap.get(createdById) : null,
      updatedBy: updatedById ? userMap.get(updatedById) : null,
      deletedBy: deletedById ? userMap.get(deletedById) : null,
    }));
  }
}
