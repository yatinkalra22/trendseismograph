import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AlertsService } from '../modules/alerts/alerts.service';
import { Resend } from 'resend';

@Processor('alerts')
export class AlertsProcessor {
  private readonly logger = new Logger(AlertsProcessor.name);
  private readonly resendApiKey = process.env.RESEND_API_KEY ?? '';
  private readonly fromEmail = process.env.ALERT_FROM_EMAIL ?? 'alerts@trendseismograph.com';
  private readonly frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
  private readonly resend = this.resendApiKey ? new Resend(this.resendApiKey) : null;

  constructor(private alertsService: AlertsService) {}

  @Process('check-alerts')
  async handleCheckAlerts(job: Job<{ trendId: string; tps: number; stage: string }>) {
    const { trendId, tps, stage } = job.data;
    this.logger.log(`Checking alerts for trend ${trendId}: TPS=${tps}, stage=${stage}`);

    const triggered = await this.alertsService.getTriggeredAlerts(trendId, tps, stage);
    if (triggered.length === 0) return;

    if (!this.resend) {
      this.logger.warn(`Skipping ${triggered.length} alert(s): RESEND_API_KEY not configured`);
      return;
    }

    for (const alert of triggered) {
      const trendName = alert.trend?.name ?? trendId;
      const trendSlug = alert.trend?.slug;
      const stageLabel = stage.replace(/_/g, ' ');
      const trendLink = trendSlug ? `${this.frontendUrl}/trends/${trendSlug}` : this.frontendUrl;

      try {
        await this.resend.emails.send({
          from: this.fromEmail,
          to: alert.userEmail,
          subject: `${trendName} is now ${stageLabel} (TPS ${tps.toFixed(1)})`,
          html: [
            `<p>Your alert for <strong>${trendName}</strong> has triggered.</p>`,
            `<p>Current stage: <strong>${stageLabel}</strong></p>`,
            `<p>Current Tipping Point Score: <strong>${tps.toFixed(2)}</strong></p>`,
            `<p><a href="${trendLink}">View trend details</a></p>`,
          ].join(''),
        });

        await this.alertsService.deactivateAlert(alert.id);
        this.logger.log(`Alert email sent to ${alert.userEmail} for trend ${trendName}`);
      } catch (error) {
        this.logger.error(`Failed to send alert email to ${alert.userEmail}: ${error.message}`);
      }
    }
  }
}
