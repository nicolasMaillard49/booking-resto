import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ScheduleExceptionsService } from './schedule-exceptions.service';
import { CreateExceptionDto } from './dto/create-exception.dto';

@ApiTags('schedule-exceptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('schedule-exceptions')
export class ScheduleExceptionsController {
  constructor(private svc: ScheduleExceptionsService) {}
  @Get()         findAll()                              { return this.svc.findAll(); }
  @Post()        create(@Body() dto: CreateExceptionDto) { return this.svc.create(dto); }
  @Delete(':id') remove(@Param('id') id: string)         { return this.svc.remove(id); }
}
