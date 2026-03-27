import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { TrendScore } from './trend-score.entity';

@Entity('trends')
export class Trend {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ name: 'is_historical', default: false })
  isHistorical: boolean;

  @Column({ name: 'actual_outcome', nullable: true })
  actualOutcome: string;

  @OneToMany(() => TrendScore, (score) => score.trend)
  scores: TrendScore[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
