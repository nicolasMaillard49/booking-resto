import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@ApiTags('admin/stats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('admin/stats')
export class StatsController {
  constructor(private stats: StatsService) {}
  @Get('overview') overview() { return this.stats.overview(); }
  @Get('period')   period(@Query('from') from: string, @Query('to') to: string) { return this.stats.byPeriod(from, to); }
}
