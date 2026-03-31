import { registerAs } from '@nestjs/config';

export default registerAs('security', () => ({
  apiKeySecret: process.env.API_KEY_SECRET ?? '',
  nlpServiceSecret: process.env.NLP_SERVICE_SECRET ?? '',
}));
