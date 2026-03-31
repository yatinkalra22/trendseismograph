import { registerAs } from '@nestjs/config';

export default registerAs('ingestion', () => ({
  nlpServiceUrl: process.env.NLP_SERVICE_URL ?? 'http://localhost:8000',
  classifyTimeoutMs: parseInt(process.env.NLP_CLASSIFY_TIMEOUT_MS ?? '30000', 10),
  redditTimeoutMs: parseInt(process.env.NLP_REDDIT_TIMEOUT_MS ?? '15000', 10),
  trendsTimeoutMs: parseInt(process.env.NLP_TRENDS_TIMEOUT_MS ?? '20000', 10),
  wikipediaTimeoutMs: parseInt(process.env.NLP_WIKIPEDIA_TIMEOUT_MS ?? '10000', 10),
  healthTimeoutMs: parseInt(process.env.NLP_HEALTH_TIMEOUT_MS ?? '5000', 10),
}));
