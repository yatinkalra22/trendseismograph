import { Controller, Get, Inject } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigType } from '@nestjs/config';
import appConfig from './config/app.config';
import ingestionConfig from './modules/ingestion/ingestion.config';
import { IngestionApplicationService } from './modules/ingestion/application/ingestion-application.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>,
    @Inject(ingestionConfig.KEY)
    private readonly ingestionCfg: ConfigType<typeof ingestionConfig>,
    private readonly ingestionService: IngestionApplicationService,
  ) {}

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'trendseismograph-api',
      environment: this.appCfg.environment,
      timestamp: new Date().toISOString(),
    };
  }

  @Get('nlp')
  async nlpHealth() {
    const reachable = await this.ingestionService.health();
    return {
      status: reachable ? 'ok' : 'error',
      nlpServiceUrl: this.ingestionCfg.nlpServiceUrl,
      nlp: reachable ? 'reachable' : 'unreachable',
      timestamp: new Date().toISOString(),
    };
  }
}
