import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import {
  GoogleTrendsResponse,
  RedditDataResponse,
  WikipediaResponse,
} from '../modules/ingestion/adapters/nlp-client.adapter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrendScore } from '../modules/trends/entities/trend-score.entity';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ScoringApplicationService } from '../modules/scoring/application/scoring-application.service';

@Processor('nlp-scoring')
export class ScoringProcessor {
  private readonly logger = new Logger(ScoringProcessor.name);

  constructor(
    private readonly scoringApplicationService: ScoringApplicationService,
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

    const scoringResult = await this.scoringApplicationService.scoreTrend({
      slug,
      redditData,
      googleData,
      wikiData,
    });

    await this.scoreRepo.save({
      trendId,
      tippingPointScore: scoringResult.tippingPointScore,
      discourseStage: scoringResult.discourseStage,
      stageConfidence: scoringResult.stageConfidence,
      googleTrendValue: googleData.current_value || 0,
      googleTrendVelocity: googleData.velocity || 0,
      redditPostCount: redditData.post_count || 0,
      redditSentiment: scoringResult.sentimentScore,
      wikipediaPageviews: wikiData.pageviews || 0,
      crossPlatformScore: scoringResult.crossPlatformScore,
    });

    await this.redis.del(`trend:${slug}:latest`);
    await this.redis.del('leaderboard:tps');
    await this.redis.del('trends:tipping');
    await this.redis.del('trends:rising');

    await this.alertsQueue.add('check-alerts', {
      trendId,
      tps: scoringResult.tippingPointScore,
      stage: scoringResult.discourseStage,
    });
  }
}
