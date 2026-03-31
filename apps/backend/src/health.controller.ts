import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { NlpService } from './modules/ingestion/nlp.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly config: ConfigService,
    private readonly nlpService: NlpService,
  ) {}

  @Get()
  health() {
    return {
      status: 'ok',
      service: 'trendseismograph-api',
      environment: this.config.get<string>('NODE_ENV', 'development'),
      timestamp: new Date().toISOString(),
    };
  }

  @Get('nlp')
  async nlpHealth() {
    const reachable = await this.nlpService.health();
    return {
      status: reachable ? 'ok' : 'error',
      nlpServiceUrl: this.config.get<string>('NLP_SERVICE_URL', 'http://localhost:8000'),
      nlp: reachable ? 'reachable' : 'unreachable',
      timestamp: new Date().toISOString(),
    };
  }
}
