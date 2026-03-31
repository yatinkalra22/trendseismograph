import { registerAs } from '@nestjs/config';

export default registerAs('alerts', () => ({
  resendApiKey: process.env.RESEND_API_KEY ?? '',
  fromEmail: process.env.ALERT_FROM_EMAIL ?? 'alerts@trendseismograph.com',
  frontendUrl: process.env.FRONTEND_URL ?? 'http://localhost:3000',
}));
