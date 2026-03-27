import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Trend } from '../../trends/entities/trend.entity';

@Entity('alerts')
export class Alert {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_email' })
  userEmail: string;

  @ManyToOne(() => Trend, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trend_id' })
  trend: Trend;

  @Column({ name: 'trend_id' })
  trendId: string;

  @Column({ name: 'trigger_stage', nullable: true })
  triggerStage: string;

  @Column({ name: 'trigger_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  triggerScore: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
