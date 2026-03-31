import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Queue } from 'bull';

@Injectable()
export class IngestionScheduler implements OnModuleInit {
  private readonly logger = new Logger(IngestionScheduler.name);

  constructor(@InjectQueue('trend-ingestion') private ingestionQueue: Queue) {}

  async onModuleInit() {
    await this.ingestionQueue.add(
      'ingest-all',
      {},
      {
        jobId: 'ingest-all-every-6-hours',
        repeat: { every: 6 * 60 * 60 * 1000 },
        removeOnComplete: true,
        attempts: 3,
      },
    );

    this.logger.log('Scheduled repeat job: ingest-all every 6 hours');
  }
}
