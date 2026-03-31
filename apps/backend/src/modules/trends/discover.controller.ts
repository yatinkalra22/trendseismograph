import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TrendsService } from './trends.service';
import { DiscoverQueryDto } from './dto/discover-query.dto';

@ApiTags('discovery')
@Controller('api/discover')
export class DiscoverController {
  constructor(private readonly trendsService: TrendsService) {}

  @Get()
  search(@Query() query: DiscoverQueryDto) {
    const q = query.q ?? '';
    if (!q) {
      return [];
    }
    return this.trendsService.search(q);
  }

  @Get('categories')
  getCategories() {
    return this.trendsService.getCategories();
  }

  @Get('new')
  getNew() {
    return this.trendsService.getNew();
  }
}
