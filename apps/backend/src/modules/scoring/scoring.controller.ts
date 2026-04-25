import { Controller, Get, Post, Param, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { TrendScore } from '../trends/entities/trend-score.entity';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { getCachedJson, setCachedJson } from '../../common/cache/cache-json';
import { ApiDiscourseStage, ApiTrendSummary } from '../../common/contracts/api-contracts';

@ApiTags('scores')
@Controller('api/scores')
export class ScoringController {
  private readonly logger = new Logger(ScoringController.name);

  constructor(
    @InjectRepository(TrendScore) private scoreRepo: Repository<TrendScore>,
    @InjectRedis() private redis: Redis,
    @InjectQueue('trend-ingestion') private ingestionQueue: Queue,
  ) {}

  @Get('leaderboard')
  async getLeaderboard(): Promise<ApiTrendSummary[]> {
    const cached = await getCachedJson<ApiTrendSummary[]>(this.redis, 'leaderboard:tps', this.logger);
    if (cached) return cached;

    const scores = await this.scoreRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.trend', 't')
      .distinctOn(['s.trend_id'])
      .orderBy('s.trend_id')
      .addOrderBy('s.scored_at', 'DESC')
      .getMany();

    const leaderboard = scores
      .map((s) => ({
        slug: s.trend.slug,
        name: s.trend.name,
        category: s.trend.category,
        tippingPointScore: Number(s.tippingPointScore),
        discourseStage: s.discourseStage as ApiDiscourseStage,
        stageConfidence: Number(s.stageConfidence),
        googleTrendValue: s.googleTrendValue,
        googleTrendVelocity: Number(s.googleTrendVelocity),
        redditPostCount: s.redditPostCount,
        redditSentiment: Number(s.redditSentiment),
        wikipediaPageviews: s.wikipediaPageviews,
        scoredAt: s.scoredAt,
      }))
      .sort((a, b) => b.tippingPointScore - a.tippingPointScore)
      .slice(0, 100);

    await setCachedJson(this.redis, 'leaderboard:tps', 1800, leaderboard, this.logger);
    return leaderboard;
  }

  @Get('tipping')
  async getTippingTrends(): Promise<ApiTrendSummary[]> {
    const cached = await getCachedJson<ApiTrendSummary[]>(this.redis, 'trends:tipping', this.logger);
    if (cached) return cached;

    const scores = await this.scoreRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.trend', 't')
      .where('s.discourse_stage = :stage', { stage: 'tipping_point' })
      .orderBy('s.scored_at', 'DESC')
      .getMany();

    // Deduplicate by trend
    const seen = new Set<string>();
    const tipping = scores
      .filter((s) => {
        if (seen.has(s.trendId)) return false;
        seen.add(s.trendId);
        return true;
      })
      .map((s) => ({
        slug: s.trend.slug,
        name: s.trend.name,
        category: s.trend.category,
        tippingPointScore: Number(s.tippingPointScore),
        discourseStage: s.discourseStage as ApiDiscourseStage,
        googleTrendVelocity: Number(s.googleTrendVelocity),
        scoredAt: s.scoredAt,
      }));

    await setCachedJson(this.redis, 'trends:tipping', 1800, tipping, this.logger);
    return tipping;
  }

  @Get('rising')
  async getRisingTrends(): Promise<ApiTrendSummary[]> {
    const cached = await getCachedJson<ApiTrendSummary[]>(this.redis, 'trends:rising', this.logger);
    if (cached) return cached;

    const scores = await this.scoreRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.trend', 't')
      .distinctOn(['s.trend_id'])
      .orderBy('s.trend_id')
      .addOrderBy('s.scored_at', 'DESC')
      .getMany();

    const rising = scores
      .map((s) => ({
        slug: s.trend.slug,
        name: s.trend.name,
        category: s.trend.category,
        tippingPointScore: Number(s.tippingPointScore),
        googleTrendVelocity: Number(s.googleTrendVelocity),
        discourseStage: s.discourseStage as ApiDiscourseStage,
        scoredAt: s.scoredAt,
      }))
      .sort((a, b) => b.googleTrendVelocity - a.googleTrendVelocity)
      .slice(0, 20);

    await setCachedJson(this.redis, 'trends:rising', 1800, rising, this.logger);
    return rising;
  }

  @Post('trigger/:slug')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  async triggerRescore(@Param('slug') slug: string) {
    await this.ingestionQueue.add('ingest-single', { slug });
    return { message: `Re-score triggered for "${slug}"` };
  }
}
