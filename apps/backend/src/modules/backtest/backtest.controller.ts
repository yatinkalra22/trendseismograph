import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { BacktestService } from './backtest.service';

@ApiTags('backtest')
@Controller('api/backtest')
export class BacktestController {
  constructor(private readonly backtestService: BacktestService) {}

  @Get('results')
  getResults() {
    return this.backtestService.getResults();
  }

  @Get('results/:slug')
  getResultsBySlug(@Param('slug') slug: string) {
    return this.backtestService.getResultsBySlug(slug);
  }

  @Get('accuracy')
  getAccuracy() {
    return this.backtestService.getAccuracy();
  }
}
