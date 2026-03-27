import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trend } from './entities/trend.entity';
import { TrendScore } from './entities/trend-score.entity';
import { TrendsController } from './trends.controller';
import { TrendsService } from './trends.service';
import { DiscoverController } from './discover.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Trend, TrendScore])],
  controllers: [TrendsController, DiscoverController],
  providers: [TrendsService],
  exports: [TrendsService, TypeOrmModule],
})
export class TrendsModule {}
