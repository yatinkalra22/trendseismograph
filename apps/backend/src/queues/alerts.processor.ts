import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AlertsService } from '../modules/alerts/alerts.service';

@Processor('alerts')
export class AlertsProcessor {
  private readonly logger = new Logger(AlertsProcessor.name);

  constructor(private alertsService: AlertsService) {}

  @Process('check-alerts')
  async handleCheckAlerts(job: Job<{ trendId: string; tps: number; stage: string }>) {
    const { trendId, tps, stage } = job.data;
    this.logger.log(`Checking alerts for trend ${trendId}: TPS=${tps}, stage=${stage}`);

    const triggered = await this.alertsService.getTriggeredAlerts(trendId, tps, stage);

    for (const alert of triggered) {
      this.logger.log(`Alert triggered for ${alert.userEmail}: trend ${trendId}`);
      // TODO: Send email via Resend API
      // const resend = new Resend(process.env.RESEND_API_KEY);
      // await resend.emails.send({ ... });
    }
  }
}
