import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios from 'axios';
import { AppErrorCode, InfrastructureError } from '../../../common/errors/app-error';
import ingestionConfig from '../ingestion.config';
import securityConfig from '../../../config/security.config';

export interface NlpClassifyRequest {
  trend_slug: string;
  posts: Array<{ title: string; body: string }>;
}

export interface NlpClassifyResponse {
  discourse_stage: string;
  stage_confidence: number;
  sentiment_score: number;
  labeled_posts: Array<{ title: string; label: string; confidence: number }>;
}

export interface RedditPost {
  title: string;
  body: string;
  score: number;
  num_comments: number;
  subreddit: string;
  created_utc: number;
}

export interface RedditDataResponse {
  posts: RedditPost[];
  post_count: number;
  comment_density: number;
  growth_rate: number;
  error?: string;
  days_in_stage?: number;
}

export interface GoogleTrendsResponse {
  current_value: number;
  velocity: number;
  history: number[];
}

export interface WikipediaResponse {
  pageviews: number;
  growth_rate: number;
  error?: string;
}

@Injectable()
export class NlpClientAdapter {
  private readonly logger = new Logger(NlpClientAdapter.name);

  constructor(
    @Inject(ingestionConfig.KEY)
    private readonly ingestionCfg: ConfigType<typeof ingestionConfig>,
    @Inject(securityConfig.KEY)
    private readonly securityCfg: ConfigType<typeof securityConfig>,
  ) {}

  private get serviceHeaders() {
    return {
      'X-Service-Key': this.securityCfg.nlpServiceSecret,
    };
  }

  async classifyDiscourse(req: NlpClassifyRequest): Promise<NlpClassifyResponse> {
    try {
      const { data } = await axios.post<NlpClassifyResponse>(
        `${this.ingestionCfg.nlpServiceUrl}/classify`,
        req,
        { timeout: this.ingestionCfg.classifyTimeoutMs, headers: this.serviceHeaders },
      );
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`NLP classify failed for ${req.trend_slug}: ${message}`);
      throw new InfrastructureError(
        AppErrorCode.EXTERNAL_SERVICE,
        'Failed to classify discourse using NLP service',
        { trendSlug: req.trend_slug },
        error,
      );
    }
  }

  async fetchRedditData(slug: string): Promise<RedditDataResponse> {
    return this.fetchWithMapping<RedditDataResponse>(
      `${this.ingestionCfg.nlpServiceUrl}/reddit/${slug}`,
      this.ingestionCfg.redditTimeoutMs,
      'fetch Reddit data',
      { slug },
    );
  }

  async fetchGoogleTrends(slug: string): Promise<GoogleTrendsResponse> {
    return this.fetchWithMapping<GoogleTrendsResponse>(
      `${this.ingestionCfg.nlpServiceUrl}/trends/${slug}`,
      this.ingestionCfg.trendsTimeoutMs,
      'fetch Google Trends data',
      { slug },
    );
  }

  async fetchWikipedia(slug: string): Promise<WikipediaResponse> {
    return this.fetchWithMapping<WikipediaResponse>(
      `${this.ingestionCfg.nlpServiceUrl}/wikipedia/${slug}`,
      this.ingestionCfg.wikipediaTimeoutMs,
      'fetch Wikipedia data',
      { slug },
    );
  }

  async health(): Promise<boolean> {
    try {
      const { status } = await axios.get(`${this.ingestionCfg.nlpServiceUrl}/health`, {
        timeout: this.ingestionCfg.healthTimeoutMs,
      });
      return status === 200;
    } catch {
      return false;
    }
  }

  private async fetchWithMapping<T>(
    url: string,
    timeoutMs: number,
    operation: string,
    details?: Record<string, unknown>,
  ): Promise<T> {
    try {
      const { data } = await axios.get<T>(url, {
        timeout: timeoutMs,
        headers: this.serviceHeaders,
      });
      return data;
    } catch (error: unknown) {
      throw new InfrastructureError(
        AppErrorCode.EXTERNAL_SERVICE,
        `Failed to ${operation}`,
        details,
        error,
      );
    }
  }
}
