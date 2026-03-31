import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ScoringService } from '../modules/scoring/scoring.service';
import {
  GoogleTrendsResponse,
  NlpService,
  RedditDataResponse,
  WikipediaResponse,
} from '../modules/ingestion/nlp.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrendScore } from '../modules/trends/entities/trend-score.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Processor('nlp-scoring')
export class ScoringProcessor {
  private readonly logger = new Logger(ScoringProcessor.name);

  constructor(
    private scoringService: ScoringService,
    private nlpService: NlpService,
    @InjectRepository(TrendScore) private scoreRepo: Repository<TrendScore>,
    @InjectRedis() private redis: Redis,
    @InjectQueue('alerts') private alertsQueue: Queue,
  ) {}

  @Process('score-trend')
  async handleScoreTrend(
    job: Job<{
      trendId: string;
      slug: string;
      redditData: RedditDataResponse;
      googleData: GoogleTrendsResponse;
      wikiData: WikipediaResponse;
    }>,
  ) {
    const { trendId, slug, redditData, googleData, wikiData } = job.data;
    this.logger.log(`Scoring trend: ${slug}`);

    const nlpResult = await this.nlpService.classifyDiscourse({
      trend_slug: slug,
      posts: redditData.posts || [],
    });

    const tps = this.scoringService.computeTippingPointScore({
      googleTrendValue: googleData.current_value || 0,
      googleTrendVelocity: googleData.velocity || 0,
      redditPostCount: redditData.post_count || 0,
      redditPostGrowth: redditData.growth_rate || 0,
      redditSentiment: nlpResult.sentiment_score,
      redditCommentDensity: redditData.comment_density || 0,
      wikipediaPageviews: wikiData.pageviews || 0,
      wikipediaGrowth: wikiData.growth_rate || 0,
      daysInCurrentStage: redditData.days_in_stage ?? 7,
      stageConfidence: nlpResult.stage_confidence,
    });

    const crossPlatformScore = this.computeCrossPlatform(googleData, redditData, wikiData);

    await this.scoreRepo.save({
      trendId,
      tippingPointScore: tps,
      discourseStage: nlpResult.discourse_stage,
      stageConfidence: nlpResult.stage_confidence,
      googleTrendValue: googleData.current_value || 0,
      googleTrendVelocity: googleData.velocity || 0,
      redditPostCount: redditData.post_count || 0,
      redditSentiment: nlpResult.sentiment_score,
      wikipediaPageviews: wikiData.pageviews || 0,
      crossPlatformScore,
    });

    await this.redis.del(`trend:${slug}:latest`);
    await this.redis.del('leaderboard:tps');
    await this.redis.del('trends:tipping');
    await this.redis.del('trends:rising');

    await this.alertsQueue.add('check-alerts', {
      trendId,
      tps,
      stage: nlpResult.discourse_stage,
    });
  }

  private computeCrossPlatform(
    googleData: GoogleTrendsResponse,
    redditData: RedditDataResponse,
    wikiData: WikipediaResponse,
  ): number {
    let spiking = 0;
    if ((googleData.velocity || 0) > 20) spiking++;
    if ((redditData.growth_rate || 0) > 30) spiking++;
    if ((wikiData.growth_rate || 0) > 25) spiking++;
    return parseFloat(((spiking / 3) * 10).toFixed(2));
  }
}
