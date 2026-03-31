import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { Trend } from './entities/trend.entity';
import { TrendScore } from './entities/trend-score.entity';
import { CreateTrendDto } from './dto/create-trend.dto';
import { TrendQueryDto } from './dto/trend-query.dto';
import { AppErrorCode, DomainError } from '../../common/errors/app-error';
import { getCachedJson, setCachedJson } from '../../common/cache/cache-json';

@Injectable()
export class TrendsService {
  private readonly logger = new Logger(TrendsService.name);

  constructor(
    @InjectRepository(Trend) private trendRepo: Repository<Trend>,
    @InjectRepository(TrendScore) private scoreRepo: Repository<TrendScore>,
    @InjectRedis() private redis: Redis,
  ) {}

  async findAll(query: TrendQueryDto) {
    const { stage, category, page = 1, limit = 20 } = query;
    const cacheKey = `trends:list:${stage || 'all'}:${category || 'all'}:${page}:${limit}`;

    const cached = await getCachedJson<{ items: unknown[]; total: number; page: number; limit: number }>(
      this.redis,
      cacheKey,
      this.logger,
    );
    if (cached) return cached;

    const qb = this.trendRepo.createQueryBuilder('t')
      .orderBy('t.name', 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    if (category) qb.andWhere('t.category = :category', { category });

    const [trends, total] = await qb.getManyAndCount();

    const trendIds = trends.map((trend) => trend.id);
    const latestScores = trendIds.length > 0
      ? await this.scoreRepo
        .createQueryBuilder('s')
        .where('s.trend_id IN (:...trendIds)', { trendIds })
        .distinctOn(['s.trend_id'])
        .orderBy('s.trend_id')
        .addOrderBy('s.scored_at', 'DESC')
        .getMany()
      : [];

    const latestByTrendId = new Map(latestScores.map((score) => [score.trendId, score]));

    const items = trends.map((trend) => {
      const latestScore = latestByTrendId.get(trend.id);
      if (stage && latestScore?.discourseStage !== stage) {
        return null;
      }

      return {
        slug: trend.slug,
        name: trend.name,
        category: trend.category,
        description: trend.description,
        isHistorical: trend.isHistorical,
        actualOutcome: trend.actualOutcome,
        latestScore: latestScore ? {
          tippingPointScore: Number(latestScore.tippingPointScore),
          discourseStage: latestScore.discourseStage,
          stageConfidence: Number(latestScore.stageConfidence),
          googleTrendValue: latestScore.googleTrendValue,
          googleTrendVelocity: Number(latestScore.googleTrendVelocity),
          redditPostCount: latestScore.redditPostCount,
          redditSentiment: Number(latestScore.redditSentiment),
          wikipediaPageviews: latestScore.wikipediaPageviews,
          crossPlatformScore: Number(latestScore.crossPlatformScore),
          scoredAt: latestScore.scoredAt,
        } : null,
      };
    });

    const filtered = items.filter(Boolean);
    const result = { items: filtered, total: stage ? filtered.length : total, page, limit };

    await setCachedJson(this.redis, cacheKey, 900, result, this.logger);
    return result;
  }

  async findOne(slug: string) {
    const cacheKey = `trend:${slug}:latest`;
    const cached = await getCachedJson(this.redis, cacheKey, this.logger);
    if (cached) return cached;

    const trend = await this.trendRepo.findOne({ where: { slug } });
    if (!trend) {
      throw new DomainError(AppErrorCode.NOT_FOUND, `Trend "${slug}" not found`, { slug });
    }

    const latestScore = await this.scoreRepo.findOne({
      where: { trendId: trend.id },
      order: { scoredAt: 'DESC' },
    });

    const result = {
      slug: trend.slug,
      name: trend.name,
      category: trend.category,
      description: trend.description,
      isHistorical: trend.isHistorical,
      actualOutcome: trend.actualOutcome,
      createdAt: trend.createdAt,
      latestScore: latestScore ? {
        tippingPointScore: Number(latestScore.tippingPointScore),
        discourseStage: latestScore.discourseStage,
        stageConfidence: Number(latestScore.stageConfidence),
        googleTrendValue: latestScore.googleTrendValue,
        googleTrendVelocity: Number(latestScore.googleTrendVelocity),
        redditPostCount: latestScore.redditPostCount,
        redditCommentCount: latestScore.redditCommentCount,
        redditSentiment: Number(latestScore.redditSentiment),
        wikipediaPageviews: latestScore.wikipediaPageviews,
        crossPlatformScore: Number(latestScore.crossPlatformScore),
        scoredAt: latestScore.scoredAt,
      } : null,
    };

    await setCachedJson(this.redis, cacheKey, 3600, result, this.logger);
    return result;
  }

  async getHistory(slug: string, days: number) {
    const trend = await this.trendRepo.findOne({ where: { slug } });
    if (!trend) {
      throw new DomainError(AppErrorCode.NOT_FOUND, `Trend "${slug}" not found`, { slug });
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const scores = await this.scoreRepo.find({
      where: { trendId: trend.id, scoredAt: MoreThan(since) },
      order: { scoredAt: 'ASC' },
    });

    return scores.map((s) => ({
      scoredAt: s.scoredAt,
      tippingPointScore: Number(s.tippingPointScore),
      discourseStage: s.discourseStage,
      googleTrendValue: s.googleTrendValue,
      googleTrendVelocity: Number(s.googleTrendVelocity),
      redditPostCount: s.redditPostCount,
      redditSentiment: Number(s.redditSentiment),
      wikipediaPageviews: s.wikipediaPageviews,
    }));
  }

  async getRedditSamples(slug: string) {
    const trend = await this.trendRepo.findOne({ where: { slug } });
    if (!trend) {
      throw new DomainError(AppErrorCode.NOT_FOUND, `Trend "${slug}" not found`, { slug });
    }

    return this.trendRepo.query(
      `SELECT * FROM reddit_samples WHERE trend_id = $1 ORDER BY fetched_at DESC LIMIT 20`,
      [trend.id],
    );
  }

  async create(dto: CreateTrendDto) {
    const trend = this.trendRepo.create(dto);
    return this.trendRepo.save(trend);
  }

  async remove(slug: string) {
    const trend = await this.trendRepo.findOne({ where: { slug } });
    if (!trend) {
      throw new DomainError(AppErrorCode.NOT_FOUND, `Trend "${slug}" not found`, { slug });
    }
    await this.trendRepo.remove(trend);
    await this.redis.del(`trend:${slug}:latest`);
    return { message: `Trend "${slug}" removed` };
  }

  async search(q: string) {
    const cacheKey = `discover:${q}`;
    const cached = await getCachedJson(this.redis, cacheKey, this.logger);
    if (cached) return cached;

    const results = await this.trendRepo
      .createQueryBuilder('t')
      .where('LOWER(t.name) LIKE LOWER(:q)', { q: `%${q}%` })
      .orWhere('LOWER(t.slug) LIKE LOWER(:q)', { q: `%${q}%` })
      .take(20)
      .getMany();

    await setCachedJson(this.redis, cacheKey, 600, results, this.logger);
    return results;
  }

  async getCategories() {
    const results = await this.trendRepo
      .createQueryBuilder('t')
      .select('t.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('t.category')
      .getRawMany();
    return results;
  }

  async getNew() {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return this.trendRepo.find({
      where: { createdAt: MoreThan(weekAgo) },
      order: { createdAt: 'DESC' },
    });
  }
}
