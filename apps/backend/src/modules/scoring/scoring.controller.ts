import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { TrendScore } from '../trends/entities/trend-score.entity';
import { ApiKeyGuard } from '../auth/api-key.guard';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@ApiTags('scores')
@Controller('api/scores')
export class ScoringController {
  constructor(
    @InjectRepository(TrendScore) private scoreRepo: Repository<TrendScore>,
    @InjectRedis() private redis: Redis,
    @InjectQueue('trend-ingestion') private ingestionQueue: Queue,
  ) {}

  @Get('leaderboard')
  async getLeaderboard() {
    const cached = await this.redis.get('leaderboard:tps');
    if (cached) return JSON.parse(cached);

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
        discourseStage: s.discourseStage,
        stageConfidence: Number(s.stageConfidence),
        googleTrendValue: s.googleTrendValue,
        googleTrendVelocity: Number(s.googleTrendVelocity),
        redditPostCount: s.redditPostCount,
        redditSentiment: Number(s.redditSentiment),
        wikipediaPageviews: s.wikipediaPageviews,
        scoredAt: s.scoredAt,
      }))
      .sort((a, b) => b.tippingPointScore - a.tippingPointScore)
      .slice(0, 20);

    await this.redis.setex('leaderboard:tps', 1800, JSON.stringify(leaderboard));
    return leaderboard;
  }

  @Get('tipping')
  async getTippingTrends() {
    const cached = await this.redis.get('trends:tipping');
    if (cached) return JSON.parse(cached);

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
        discourseStage: s.discourseStage,
        scoredAt: s.scoredAt,
      }));

    await this.redis.setex('trends:tipping', 1800, JSON.stringify(tipping));
    return tipping;
  }

  @Get('rising')
  async getRisingTrends() {
    const cached = await this.redis.get('trends:rising');
    if (cached) return JSON.parse(cached);

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
        discourseStage: s.discourseStage,
        scoredAt: s.scoredAt,
      }))
      .sort((a, b) => b.googleTrendVelocity - a.googleTrendVelocity)
      .slice(0, 20);

    await this.redis.setex('trends:rising', 1800, JSON.stringify(rising));
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
