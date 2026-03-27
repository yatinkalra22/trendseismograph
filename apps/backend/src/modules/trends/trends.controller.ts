import { Controller, Get, Post, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { TrendsService } from './trends.service';
import { CreateTrendDto } from './dto/create-trend.dto';
import { TrendQueryDto } from './dto/trend-query.dto';
import { ApiKeyGuard } from '../auth/api-key.guard';

@ApiTags('trends')
@Controller('api/trends')
export class TrendsController {
  constructor(private readonly trendsService: TrendsService) {}

  @Get()
  findAll(@Query() query: TrendQueryDto) {
    return this.trendsService.findAll(query);
  }

  @Get(':slug')
  findOne(@Param('slug') slug: string) {
    return this.trendsService.findOne(slug);
  }

  @Get(':slug/history')
  getHistory(@Param('slug') slug: string, @Query('days') days: number = 90) {
    return this.trendsService.getHistory(slug, days);
  }

  @Get(':slug/reddit')
  getRedditSamples(@Param('slug') slug: string) {
    return this.trendsService.getRedditSamples(slug);
  }

  @Post()
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  create(@Body() dto: CreateTrendDto) {
    return this.trendsService.create(dto);
  }

  @Delete(':slug')
  @UseGuards(ApiKeyGuard)
  @ApiBearerAuth()
  remove(@Param('slug') slug: string) {
    return this.trendsService.remove(slug);
  }
}
