import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { StatsService, StatsPeriod } from './stats.service';

const ALLOWED_PERIODS: StatsPeriod[] = ['year', '12m', '90d', '30d', '7d'];

@ApiTags('stats')
@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Stats du dashboard (admin)' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ALLOWED_PERIODS,
    description: 'Plage pour la section analytique (default: year)',
  })
  getStats(@Query('period') period?: string) {
    const safePeriod: StatsPeriod = ALLOWED_PERIODS.includes(period as StatsPeriod)
      ? (period as StatsPeriod)
      : 'year';
    return this.statsService.getStats(safePeriod);
  }
}
