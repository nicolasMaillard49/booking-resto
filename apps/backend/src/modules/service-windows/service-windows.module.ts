import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ServiceWindowsController } from './service-windows.controller';
import { ServiceWindowsService } from './service-windows.service';

@Module({
  imports: [PrismaModule],
  controllers: [ServiceWindowsController],
  providers: [ServiceWindowsService],
  exports: [ServiceWindowsService],
})
export class ServiceWindowsModule {}
