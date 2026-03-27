import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert } from './entities/alert.entity';
import { Trend } from '../trends/entities/trend.entity';
import { CreateAlertDto } from './dto/create-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert) private alertRepo: Repository<Alert>,
    @InjectRepository(Trend) private trendRepo: Repository<Trend>,
  ) {}

  async create(dto: CreateAlertDto) {
    const trend = await this.trendRepo.findOne({ where: { slug: dto.slug } });
    if (!trend) throw new NotFoundException(`Trend "${dto.slug}" not found`);

    const alert = this.alertRepo.create({
      userEmail: dto.email,
      trendId: trend.id,
      triggerStage: dto.triggerStage,
      triggerScore: dto.triggerScore,
    });
    return this.alertRepo.save(alert);
  }

  async findByEmail(email: string) {
    return this.alertRepo.find({
      where: { userEmail: email, isActive: true },
      relations: ['trend'],
    });
  }

  async remove(id: string) {
    const alert = await this.alertRepo.findOne({ where: { id } });
    if (!alert) throw new NotFoundException('Alert not found');
    await this.alertRepo.remove(alert);
    return { message: 'Alert deleted' };
  }

  async getTriggeredAlerts(trendId: string, tps: number, stage: string) {
    return this.alertRepo.find({
      where: { trendId, isActive: true },
    }).then((alerts) =>
      alerts.filter(
        (a) =>
          (a.triggerStage && a.triggerStage === stage) ||
          (a.triggerScore && tps >= Number(a.triggerScore)),
      ),
    );
  }
}
