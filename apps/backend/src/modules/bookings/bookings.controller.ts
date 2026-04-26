import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingStatusDto } from './dto/update-booking-status.dto';
import { GetBookingsQueryDto } from './dto/get-bookings-query.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  // ── Routes publiques ──────────────────────────────────────

  @Post('bookings')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Créer une réservation' })
  @ApiResponse({ status: 201, description: 'Réservation créée' })
  @ApiResponse({ status: 400, description: 'Données invalides ou créneau indisponible' })
  create(@Body() dto: CreateBookingDto) {
    return this.bookingsService.create(dto);
  }

  @Get('bookings/:cancelToken/cancel')
  @Public()
  @ApiOperation({ summary: 'Annuler une réservation (lien email)' })
  cancelByToken(@Param('cancelToken') cancelToken: string) {
    return this.bookingsService.cancelByToken(cancelToken);
  }

  @Get('bookings/:confirmToken/confirm')
  @Public()
  @ApiOperation({ summary: 'Confirmer une réservation (lien email)' })
  confirmByToken(@Param('confirmToken') confirmToken: string) {
    return this.bookingsService.confirmByToken(confirmToken);
  }

  // ── Routes admin ─────────────────────────────────────────

  @Get('bookings')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Liste des réservations (admin, paginée)' })
  findAll(@Query() query: GetBookingsQueryDto) {
    return this.bookingsService.findAll(query);
  }

  @Get('bookings/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Détail d\'une réservation (admin)' })
  findOne(@Param('id') id: string) {
    return this.bookingsService.findOne(id);
  }

  @Patch('bookings/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Modifier le statut d\'une réservation (admin)' })
  updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto) {
    return this.bookingsService.updateStatus(id, dto);
  }

  @Delete('bookings/:id')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une réservation (admin)' })
  remove(@Param('id') id: string) {
    return this.bookingsService.remove(id);
  }
}
