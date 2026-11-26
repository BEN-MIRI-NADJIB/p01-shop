import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Redis } from 'ioredis';
import { Product } from './product.entity.js';
import { CreateProductDto } from './dto/create-product.dto.js';

@Injectable()
export class ProductsService {
  private redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  });

  constructor(@InjectRepository(Product) private repo: Repository<Product>) {}

  async create(dto: CreateProductDto) {
    const product = await this.repo.save(this.repo.create(dto));
    await this.redis.setex(`product:${product.id}`, 60, JSON.stringify(product));
    return product;
  }

  async findOne(id: string) {
    const cached = await this.redis.get(`product:${id}`);
    if (cached) return JSON.parse(cached);

    const product = await this.repo.findOneBy({ id });
    if (!product) throw new NotFoundException('Produit introuvable');

    await this.redis.setex(`product:${id}`, 60, JSON.stringify(product));
    return product;
  }

  async findPaginated(limit = 10, cursor?: string) {
    const qb = this.repo
      .createQueryBuilder('p')
      .where('p.active = :active', { active: true })
      .orderBy('p.createdAt', 'DESC')
      .addOrderBy('p.id', 'DESC')
      .take(limit + 1);

    if (cursor) {
      const [createdAt, id] = Buffer.from(cursor, 'base64').toString('utf8').split('|');
      qb.andWhere('(p.createdAt, p.id) < (:createdAt, :id)', { createdAt, id });
    }

    const items = await qb.getMany();
    const hasNext = items.length > limit;
    if (hasNext) items.pop();

    const last = items[items.length - 1];
    const nextCursor =
      hasNext && last
        ? Buffer.from(`${last.createdAt.toISOString()}|${last.id}`).toString('base64')
        : null;

    return { items, nextCursor };
  }
}