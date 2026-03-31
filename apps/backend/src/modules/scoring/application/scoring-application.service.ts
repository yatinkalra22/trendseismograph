import { Injectable } from '@nestjs/common';
import { ScoringService } from '../scoring.service';
import {
  GoogleTrendsResponse,
  NlpClientAdapter,
  RedditDataResponse,
  WikipediaResponse,
} from '../../ingestion/adapters/nlp-client.adapter';

export type ScoreTrendInput = {
  slug: string;
  redditData: RedditDataResponse;
  googleData: GoogleTrendsResponse;
  wikiData: WikipediaResponse;
};

export type ScoreTrendOutput = {
  tippingPointScore: number;
  discourseStage: string;
  stageConfidence: number;
  sentimentScore: number;
  crossPlatformScore: number;
};

@Injectable()
export class ScoringApplicationService {
  constructor(
    private readonly scoringService: ScoringService,
    private readonly nlpClient: NlpClientAdapter,
  ) {}

  async scoreTrend(input: ScoreTrendInput): Promise<ScoreTrendOutput> {
    const { slug, redditData, googleData, wikiData } = input;
    const nlpResult = await this.nlpClient.classifyDiscourse({
      trend_slug: slug,
      posts: redditData.posts || [],
    });

    const tippingPointScore = this.scoringService.computeTippingPointScore({
      googleTrendValue: googleData.current_value || 0,
      googleTrendVelocity: googleData.velocity || 0,
      redditPostCount: redditData.post_count || 0,
      redditPostGrowth: redditData.growth_rate || 0,
      redditSentiment: nlpResult.sentiment_score,
      redditCommentDensity: redditData.comment_density || 0,
      wikipediaPageviews: wikiData.pageviews || 0,
      wikipediaGrowth: wikiData.growth_rate || 0,
      daysInCurrentStage: redditData.days_in_stage ?? 7,
      stageConfidence: nlpResult.stage_confidence,
    });

    return {
      tippingPointScore,
      discourseStage: nlpResult.discourse_stage,
      stageConfidence: nlpResult.stage_confidence,
      sentimentScore: nlpResult.sentiment_score,
      crossPlatformScore: this.computeCrossPlatform(googleData, redditData, wikiData),
    };
  }

  private computeCrossPlatform(
    googleData: GoogleTrendsResponse,
    redditData: RedditDataResponse,
    wikiData: WikipediaResponse,
  ): number {
    let spiking = 0;
    if ((googleData.velocity || 0) > 20) spiking++;
    if ((redditData.growth_rate || 0) > 30) spiking++;
    if ((wikiData.growth_rate || 0) > 25) spiking++;
    return parseFloat(((spiking / 3) * 10).toFixed(2));
  }
}
