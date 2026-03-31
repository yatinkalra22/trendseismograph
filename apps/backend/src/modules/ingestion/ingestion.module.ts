import { Module } from '@nestjs/common';
import { NlpClientAdapter } from './adapters/nlp-client.adapter';
import { IngestionApplicationService } from './application/ingestion-application.service';

@Module({
  providers: [NlpClientAdapter, IngestionApplicationService],
  exports: [NlpClientAdapter, IngestionApplicationService],
})
export class IngestionModule {}
