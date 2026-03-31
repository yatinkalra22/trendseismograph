import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { TrendScore } from '../trends/entities/trend-score.entity';
import { ScoringService } from './scoring.service';
import { ScoringController } from './scoring.controller';
import { IngestionModule } from '../ingestion/ingestion.module';
import { ScoringApplicationService } from './application/scoring-application.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TrendScore]),
    BullModule.registerQueue({ name: 'trend-ingestion' }),
    IngestionModule,
  ],
  controllers: [ScoringController],
  providers: [ScoringService, ScoringApplicationService],
  exports: [ScoringService, ScoringApplicationService],
})
export class ScoringModule {}
