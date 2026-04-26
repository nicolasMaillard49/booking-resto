import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ScheduleExceptionsController } from './schedule-exceptions.controller';
import { ScheduleExceptionsService } from './schedule-exceptions.service';

@Module({
  imports: [PrismaModule],
  controllers: [ScheduleExceptionsController],
  providers: [ScheduleExceptionsService],
  exports: [ScheduleExceptionsService],
})
export class ScheduleExceptionsModule {}
