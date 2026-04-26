import { Controller, Get, Put, Post, Delete, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AvailabilityService } from './availability.service';
import { UpdateScheduleDto } from './dto/update-schedule.dto';
import { CreateBlockedSlotDto } from './dto/create-blocked-slot.dto';

@ApiTags('availability')
@Controller()
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Put('availability')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mettre à jour les horaires (admin)' })
  updateSchedule(@Body() dto: UpdateScheduleDto) {
    return this.availabilityService.updateSchedule(dto);
  }

  @Get('availability/blocks')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des créneaux bloqués (admin)' })
  getBlockedSlots() {
    return this.availabilityService.getBlockedSlots();
  }

  @Post('availability/block')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Bloquer un créneau (admin)' })
  blockSlot(@Body() dto: CreateBlockedSlotDto) {
    return this.availabilityService.blockSlot(dto);
  }

  @Delete('availability/block/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Débloquer un créneau (admin)' })
  unblockSlot(@Param('id') id: string) {
    return this.availabilityService.unblockSlot(id);
  }
}
