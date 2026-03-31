import { Injectable } from '@nestjs/common';
import {
  GoogleTrendsResponse,
  NlpClientAdapter,
  RedditDataResponse,
  WikipediaResponse,
} from '../adapters/nlp-client.adapter';

export type IngestionSignals = {
  redditData: RedditDataResponse;
  googleData: GoogleTrendsResponse;
  wikiData: WikipediaResponse;
};

@Injectable()
export class IngestionApplicationService {
  constructor(private readonly nlpClient: NlpClientAdapter) {}

  async gatherSignals(slug: string): Promise<IngestionSignals> {
    const [redditData, googleData, wikiData] = await Promise.all([
      this.nlpClient.fetchRedditData(slug),
      this.nlpClient.fetchGoogleTrends(slug),
      this.nlpClient.fetchWikipedia(slug),
    ]);

    return { redditData, googleData, wikiData };
  }

  async health(): Promise<boolean> {
    return this.nlpClient.health();
  }
}
