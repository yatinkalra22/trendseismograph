import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Trend } from '../../trends/entities/trend.entity';

@Entity('backtest_results')
export class BacktestResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trend, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trend_id' })
  trend: Trend;

  @Column({ name: 'trend_id' })
  trendId: string;

  @Column({ name: 'predicted_stage', nullable: true })
  predictedStage: string;

  @Column({ name: 'predicted_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  predictedScore: number;

  @Column({ name: 'actual_outcome', nullable: true })
  actualOutcome: string;

  @Column({ name: 'was_correct', nullable: true })
  wasCorrect: boolean;

  @Column({ name: 'weeks_before_peak', nullable: true })
  weeksBeforePeak: number;

  @CreateDateColumn({ name: 'run_at' })
  runAt: Date;
}
