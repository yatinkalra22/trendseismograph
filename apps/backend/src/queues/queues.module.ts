import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IngestionProcessor } from './ingestion.processor';
import { ScoringProcessor } from './scoring.processor';
import { AlertsProcessor } from './alerts.processor';
import { IngestionScheduler } from './ingestion.scheduler';
import { Trend } from '../modules/trends/entities/trend.entity';
import { TrendScore } from '../modules/trends/entities/trend-score.entity';
import { Alert } from '../modules/alerts/entities/alert.entity';
import { IngestionModule } from '../modules/ingestion/ingestion.module';
import { ScoringModule } from '../modules/scoring/scoring.module';
import { AlertsModule } from '../modules/alerts/alerts.module';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'trend-ingestion' },
      { name: 'nlp-scoring' },
      { name: 'alerts' },
    ),
    TypeOrmModule.forFeature([Trend, TrendScore, Alert]),
    IngestionModule,
    ScoringModule,
    AlertsModule,
  ],
  providers: [IngestionProcessor, ScoringProcessor, AlertsProcessor, IngestionScheduler],
})
export class QueuesModule {}
