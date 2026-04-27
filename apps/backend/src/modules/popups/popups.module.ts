import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { PopupsController } from './popups.controller';
import { PopupsService } from './popups.service';

@Module({
  imports: [PrismaModule],
  controllers: [PopupsController],
  providers: [PopupsService],
})
export class PopupsModule {}
