import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

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
export class NlpService {
  private readonly logger = new Logger(NlpService.name);
  private readonly baseUrl = process.env.NLP_SERVICE_URL ?? 'http://localhost:8000';
  private readonly serviceHeaders = {
    'X-Service-Key': process.env.NLP_SERVICE_SECRET ?? '',
  };

  async classifyDiscourse(req: NlpClassifyRequest): Promise<NlpClassifyResponse> {
    try {
      const { data } = await axios.post<NlpClassifyResponse>(
        `${this.baseUrl}/classify`,
        req,
        { timeout: 30_000, headers: this.serviceHeaders },
      );
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'unknown error';
      this.logger.error(`NLP classify failed for ${req.trend_slug}: ${message}`);
      throw error;
    }
  }

  async fetchRedditData(slug: string): Promise<RedditDataResponse> {
    const { data } = await axios.get<RedditDataResponse>(`${this.baseUrl}/reddit/${slug}`, { timeout: 15_000, headers: this.serviceHeaders });
    return data;
  }

  async fetchGoogleTrends(slug: string): Promise<GoogleTrendsResponse> {
    const { data } = await axios.get<GoogleTrendsResponse>(`${this.baseUrl}/trends/${slug}`, { timeout: 20_000, headers: this.serviceHeaders });
    return data;
  }

  async fetchWikipedia(slug: string): Promise<WikipediaResponse> {
    const { data } = await axios.get<WikipediaResponse>(`${this.baseUrl}/wikipedia/${slug}`, { timeout: 10_000, headers: this.serviceHeaders });
    return data;
  }

  async health(): Promise<boolean> {
    try {
      const { status } = await axios.get(`${this.baseUrl}/health`, { timeout: 5_000 });
      return status === 200;
    } catch {
      return false;
    }
  }
}
