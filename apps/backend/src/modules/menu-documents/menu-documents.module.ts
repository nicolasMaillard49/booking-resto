import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { MenuDocumentsController } from './menu-documents.controller';
import { MenuDocumentsService } from './menu-documents.service';

@Module({
  imports: [PrismaModule],
  controllers: [MenuDocumentsController],
  providers: [MenuDocumentsService],
  exports: [MenuDocumentsService],
})
export class MenuDocumentsModule {}
