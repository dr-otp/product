import { Module } from '@nestjs/common';
import { NatsModule } from 'src/transports/nats.module';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  controllers: [ProductController],
  providers: [ProductService],
  imports: [NatsModule],
})
export class ProductModule {}
