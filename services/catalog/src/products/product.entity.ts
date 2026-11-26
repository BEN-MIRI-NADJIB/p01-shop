import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
@Index(['createdAt', 'id']) // Indispensable pour la pagination curseur rapide
export class Product {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) sku: string;
  @Column() name: string;
  @Column({ type: 'text', nullable: true }) description: string;
  @Column({ type: 'int' }) priceCents: number;
  @Column({ default: true }) active: boolean;
  @CreateDateColumn() createdAt: Date;
}