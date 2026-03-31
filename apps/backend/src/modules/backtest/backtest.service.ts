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

    const ci = this.computeWilson95(correct, total);
    const outcomeMetrics = this.computeOutcomeMetrics(results);
    const weeksDistribution = this.computeWeeksDistribution(mainstream);

    const result = {
      overallAccuracy: parseFloat(accuracy.toFixed(3)),
      overallAccuracyCI95: {
        lower: parseFloat(ci.lower.toFixed(3)),
        upper: parseFloat(ci.upper.toFixed(3)),
      },
      totalTrends: total,
      correctPredictions: correct,
      avgWeeksBeforePeak: parseFloat(avgWeeksBeforePeak.toFixed(1)),
      categoryAccuracy,
      outcomeMetrics,
      weeksBeforePeakDistribution: weeksDistribution,
    };

    await this.redis.setex(cacheKey, 86400, JSON.stringify(result));
    return result;
  }

  private computeWilson95(successes: number, total: number) {
    if (total === 0) {
      return { lower: 0, upper: 0 };
    }

    const z = 1.96;
    const p = successes / total;
    const z2 = z * z;
    const denom = 1 + z2 / total;
    const center = (p + z2 / (2 * total)) / denom;
    const margin =
      (z * Math.sqrt((p * (1 - p) + z2 / (4 * total)) / total)) / denom;

    return {
      lower: Math.max(0, center - margin),
      upper: Math.min(1, center + margin),
    };
  }

  private computeOutcomeMetrics(results: BacktestResult[]) {
    const predictedMainstream = (r: BacktestResult) => {
      const stage = (r.predictedStage || '').toLowerCase();
      return ['approaching_tipping', 'tipping_point', 'mainstream', 'saturation'].includes(stage)
        || Number(r.predictedScore) >= 7;
    };

    let tp = 0;
    let fp = 0;
    let fn = 0;
    let tn = 0;

    for (const r of results) {
      const actualPositive = r.actualOutcome === 'mainstream';
      const predictedPositive = predictedMainstream(r);

      if (actualPositive && predictedPositive) tp++;
      else if (!actualPositive && predictedPositive) fp++;
      else if (actualPositive && !predictedPositive) fn++;
      else tn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0 ? (2 * precision * recall) / (precision + recall) : 0;

    return {
      precision: parseFloat(precision.toFixed(3)),
      recall: parseFloat(recall.toFixed(3)),
      f1: parseFloat(f1.toFixed(3)),
      confusionMatrix: {
        truePositive: tp,
        falsePositive: fp,
        falseNegative: fn,
        trueNegative: tn,
      },
    };
  }

  private computeWeeksDistribution(mainstreamResults: BacktestResult[]) {
    const values = mainstreamResults
      .map((r) => r.weeksBeforePeak)
      .filter((v): v is number => typeof v === 'number')
      .sort((a, b) => a - b);

    if (values.length === 0) {
      return { min: 0, p50: 0, p90: 0, max: 0 };
    }

    const percentile = (p: number) => {
      const idx = Math.min(values.length - 1, Math.max(0, Math.ceil((p / 100) * values.length) - 1));
      return values[idx];
    };

    return {
      min: values[0],
      p50: percentile(50),
      p90: percentile(90),
      max: values[values.length - 1],
    };
  }
}
