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
    } catch (error) {
      this.logger.error(`NLP classify failed for ${req.trend_slug}: ${error.message}`);
      throw error;
    }
  }

  async fetchRedditData(slug: string): Promise<any> {
    const { data } = await axios.get(`${this.baseUrl}/reddit/${slug}`, { timeout: 15_000, headers: this.serviceHeaders });
    return data;
  }

  async fetchGoogleTrends(slug: string): Promise<any> {
    const { data } = await axios.get(`${this.baseUrl}/trends/${slug}`, { timeout: 20_000, headers: this.serviceHeaders });
    return data;
  }

  async fetchWikipedia(slug: string): Promise<any> {
    const { data } = await axios.get(`${this.baseUrl}/wikipedia/${slug}`, { timeout: 10_000, headers: this.serviceHeaders });
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
