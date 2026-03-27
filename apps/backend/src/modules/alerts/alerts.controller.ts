import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('alerts')
@Controller('api/alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Post()
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  create(@Body() dto: CreateAlertDto) {
    return this.alertsService.create(dto);
  }

  @Get()
  findByEmail(@Query('email') email: string) {
    return this.alertsService.findByEmail(email);
  }

  @Delete(':id')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  remove(@Param('id') id: string, @Query('email') email: string) {
    return this.alertsService.remove(id, email);
  }
}
