import { Process, Processor } from '@nestjs/bull';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bull';
import { AlertsService } from '../modules/alerts/alerts.service';
import { Resend } from 'resend';
import alertsConfig from '../modules/alerts/alerts.config';
import { ConfigType } from '@nestjs/config';

@Processor('alerts')
export class AlertsProcessor {
  private readonly logger = new Logger(AlertsProcessor.name);
  private readonly resend: Resend | null;

  constructor(
    private readonly alertsService: AlertsService,
    @Inject(alertsConfig.KEY)
    private readonly alertsCfg: ConfigType<typeof alertsConfig>,
  ) {
    this.resend = this.alertsCfg.resendApiKey ? new Resend(this.alertsCfg.resendApiKey) : null;
  }

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
      const trendLink = trendSlug ? `${this.alertsCfg.frontendUrl}/trends/${trendSlug}` : this.alertsCfg.frontendUrl;

      try {
        await this.resend.emails.send({
          from: this.alertsCfg.fromEmail,
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
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.logger.error(`Failed to send alert email to ${alert.userEmail}: ${message}`);
      }
    }
  }
}
