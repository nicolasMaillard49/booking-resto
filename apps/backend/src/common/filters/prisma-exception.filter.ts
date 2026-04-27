import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpStatus, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * Convertit les erreurs Prisma en HttpException attendues par le HttpExceptionFilter,
 * pour ne plus avoir besoin de catch silencieux dans les services.
 *
 * Codes Prisma fréquents :
 * - P2025 : Record to update/delete not found  → 404
 * - P2003 : Foreign key constraint violation   → 400 ("Ressource utilisée ailleurs")
 * - P2002 : Unique constraint violation        → 409
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Erreur base de données';
    let error: string = HttpStatus[statusCode] || 'Error';

    switch (exception.code) {
      case 'P2025':
        statusCode = HttpStatus.NOT_FOUND;
        message = 'Ressource non trouvée';
        error = 'NOT_FOUND';
        break;
      case 'P2003':
        statusCode = HttpStatus.BAD_REQUEST;
        message = 'Ressource utilisée ailleurs, désassocier d\'abord';
        error = 'BAD_REQUEST';
        break;
      case 'P2002':
        statusCode = HttpStatus.CONFLICT;
        message = 'Cette valeur existe déjà';
        error = 'CONFLICT';
        break;
      default:
        // Code Prisma non spécifiquement géré → log + 500
        this.logger.error(`Unhandled Prisma error ${exception.code}: ${exception.message}`);
        break;
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
