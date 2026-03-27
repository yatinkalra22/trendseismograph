import { DataSource } from 'typeorm';
import { Trend } from '../modules/trends/entities/trend.entity';
import { TrendScore } from '../modules/trends/entities/trend-score.entity';
import { Alert } from '../modules/alerts/entities/alert.entity';
import { BacktestResult } from '../modules/backtest/entities/backtest-result.entity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/trendseismograph',
  entities: [Trend, TrendScore, Alert, BacktestResult],
  synchronize: false,
  migrations: ['src/database/migrations/*.ts'],
});
