import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Trend } from './trend.entity';

@Entity('trend_scores')
export class TrendScore {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Trend, (trend) => trend.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trend_id' })
  trend: Trend;

  @Column({ name: 'trend_id' })
  trendId: string;

  @Column({ name: 'tipping_point_score', type: 'numeric', precision: 5, scale: 2 })
  tippingPointScore: number;

  @Column({ name: 'discourse_stage' })
  discourseStage: string;

  @Column({ name: 'stage_confidence', type: 'numeric', precision: 4, scale: 3 })
  stageConfidence: number;

  @Column({ name: 'google_trend_value', nullable: true })
  googleTrendValue: number;

  @Column({ name: 'google_trend_velocity', type: 'numeric', precision: 8, scale: 4, nullable: true })
  googleTrendVelocity: number;

  @Column({ name: 'reddit_post_count', nullable: true })
  redditPostCount: number;

  @Column({ name: 'reddit_comment_count', nullable: true })
  redditCommentCount: number;

  @Column({ name: 'reddit_sentiment', type: 'numeric', precision: 4, scale: 3, nullable: true })
  redditSentiment: number;

  @Column({ name: 'wikipedia_pageviews', nullable: true })
  wikipediaPageviews: number;

  @Column({ name: 'cross_platform_score', type: 'numeric', precision: 5, scale: 2, nullable: true })
  crossPlatformScore: number;

  @CreateDateColumn({ name: 'scored_at' })
  scoredAt: Date;
}
