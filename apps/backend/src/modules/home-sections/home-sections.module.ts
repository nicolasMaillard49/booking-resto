import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { TranslationModule } from '../translation/translation.module';
import { HomeSectionsController } from './home-sections.controller';
import { HomeSectionsService } from './home-sections.service';

@Module({
  imports: [PrismaModule, TranslationModule],
  controllers: [HomeSectionsController],
  providers: [HomeSectionsService],
  exports: [HomeSectionsService],
})
export class HomeSectionsModule {}
