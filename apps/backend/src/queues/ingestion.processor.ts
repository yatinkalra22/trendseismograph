import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { NlpService } from '../modules/ingestion/nlp.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trend } from '../modules/trends/entities/trend.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Processor('trend-ingestion')
export class IngestionProcessor {
  private readonly logger = new Logger(IngestionProcessor.name);

  constructor(
    private nlpService: NlpService,
    @InjectRepository(Trend) private trendRepo: Repository<Trend>,
    @InjectQueue('nlp-scoring') private scoringQueue: Queue,
  ) {}

  @Process('ingest-all')
  async handleIngestAll(_job: Job) {
    this.logger.log('Starting ingestion for all tracked trends');
    const trends = await this.trendRepo.find();

    for (const trend of trends) {
      try {
        const [redditData, googleData, wikiData] = await Promise.all([
          this.nlpService.fetchRedditData(trend.slug),
          this.nlpService.fetchGoogleTrends(trend.slug),
          this.nlpService.fetchWikipedia(trend.slug),
        ]);

        await this.scoringQueue.add('score-trend', {
          trendId: trend.id,
          slug: trend.slug,
          redditData,
          googleData,
          wikiData,
        });

        await new Promise((r) => setTimeout(r, 2000));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'unknown error';
        this.logger.error(`Ingestion failed for ${trend.slug}: ${message}`);
      }
    }
  }

  @Process('ingest-single')
  async handleIngestSingle(job: Job<{ slug: string }>) {
    const { slug } = job.data;
    const trend = await this.trendRepo.findOne({ where: { slug } });
    if (!trend) return;

    const [redditData, googleData, wikiData] = await Promise.all([
      this.nlpService.fetchRedditData(slug),
      this.nlpService.fetchGoogleTrends(slug),
      this.nlpService.fetchWikipedia(slug),
    ]);

    await this.scoringQueue.add('score-trend', {
      trendId: trend.id,
      slug,
      redditData,
      googleData,
      wikiData,
    });
  }
}
