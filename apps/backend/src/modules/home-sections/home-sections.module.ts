import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { HomeSectionsController } from './home-sections.controller';
import { HomeSectionsService } from './home-sections.service';

@Module({
  imports: [PrismaModule],
  controllers: [HomeSectionsController],
  providers: [HomeSectionsService],
  exports: [HomeSectionsService],
})
export class HomeSectionsModule {}
