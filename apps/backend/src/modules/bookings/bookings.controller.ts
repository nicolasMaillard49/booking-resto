import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private bookings: BookingsService) {}

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('bookings')
  create(@Body() dto: CreateBookingDto) {
    return this.bookings.create(dto);
  }

  @Public()
  @Get('bookings/:cancelToken/cancel')
  cancel(@Param('cancelToken') token: string) {
    return this.bookings.cancelByToken(token);
  }

  @Public()
  @Get('bookings/:confirmToken/confirm')
  confirm(@Param('confirmToken') token: string) {
    return this.bookings.confirmByToken(token);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('admin/bookings')
  findAll(@Query() q: GetBookingsQueryDto) {
    return this.bookings.findAll(q);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('admin/bookings/agenda')
  agenda(@Query('from') from: string, @Query('to') to: string) {
    return this.bookings.agenda(from, to);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('admin/bookings/:id')
  findOne(@Param('id') id: string) {
    return this.bookings.findOne(id);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch('admin/bookings/:id')
  update(@Param('id') id: string, @Body() dto: UpdateBookingDto) {
    return this.bookings.update(id, dto);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Delete('admin/bookings/:id')
  remove(@Param('id') id: string) {
    return this.bookings.remove(id);
  }
}
