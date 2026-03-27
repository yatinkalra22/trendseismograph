import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import axios from 'axios';

@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  health() {
    return { status: 'ok', service: 'trendseismograph-api', timestamp: new Date().toISOString() };
  }

  @Get('nlp')
  async nlpHealth() {
    try {
      const { data } = await axios.get(`${process.env.NLP_SERVICE_URL || 'http://localhost:8000'}/health`, { timeout: 5000 });
      return { status: 'ok', nlp: data };
    } catch {
      return { status: 'error', nlp: 'unreachable' };
    }
  }
}
