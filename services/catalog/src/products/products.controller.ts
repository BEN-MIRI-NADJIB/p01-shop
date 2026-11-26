import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ProductsService } from './products.service.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Controller('products')
export class ProductsController {
  constructor(private products: ProductsService) {}

  @Post()
  create(@Body() dto: CreateProductDto) {
    return this.products.create(dto);
  }

  @Get()
  list(@Query('limit') limit?: string, @Query('cursor') cursor?: string) {
    return this.products.findPaginated(limit ? Number(limit) : 10, cursor);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.products.findOne(id);
  }
}