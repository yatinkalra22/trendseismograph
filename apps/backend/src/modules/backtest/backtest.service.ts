import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { BacktestResult } from './entities/backtest-result.entity';

@Injectable()
export class BacktestService {
  constructor(
    @InjectRepository(BacktestResult) private backtestRepo: Repository<BacktestResult>,
    @InjectRedis() private redis: Redis,
  ) {}

  async getResults() {
    return this.backtestRepo.find({
      relations: ['trend'],
      order: { runAt: 'DESC' },
    });
  }

  async getResultsBySlug(slug: string) {
    return this.backtestRepo.find({
      where: { trend: { slug } },
      relations: ['trend'],
      order: { runAt: 'DESC' },
    });
  }

  async getAccuracy() {
    const cacheKey = 'backtest:accuracy';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const results = await this.backtestRepo.find({ relations: ['trend'] });

    const total = results.length;
    const correct = results.filter((r) => r.wasCorrect).length;
    const accuracy = total > 0 ? correct / total : 0;

    const mainstream = results.filter((r) => r.actualOutcome === 'mainstream');
    const avgWeeksBeforePeak =
      mainstream.length > 0
        ? mainstream.reduce((sum, r) => sum + (r.weeksBeforePeak || 0), 0) / mainstream.length
        : 0;

    const byCategory: Record<string, { total: number; correct: number }> = {};
    results.forEach((r) => {
      const cat = r.trend?.category || 'unknown';
      if (!byCategory[cat]) byCategory[cat] = { total: 0, correct: 0 };
      byCategory[cat].total++;
      if (r.wasCorrect) byCategory[cat].correct++;
    });

    const categoryAccuracy = Object.entries(byCategory).map(([category, data]) => ({
      category,
      accuracy: data.total > 0 ? data.correct / data.total : 0,
      total: data.total,
      correct: data.correct,
    }));

    const result = {
      overallAccuracy: parseFloat(accuracy.toFixed(3)),
      totalTrends: total,
      correctPredictions: correct,
      avgWeeksBeforePeak: parseFloat(avgWeeksBeforePeak.toFixed(1)),
      categoryAccuracy,
    };

    await this.redis.setex(cacheKey, 86400, JSON.stringify(result));
    return result;
  }
}
