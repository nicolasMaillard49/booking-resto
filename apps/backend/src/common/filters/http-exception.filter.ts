// ============================================================
// Filtre d'exceptions global — Format d'erreur standardisé
// Inspiré RFC 7807 Problem Details
// ============================================================

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ValidationError {
  field: string;
  message: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Une erreur inattendue est survenue';
    let details: ValidationError[] | undefined;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        
        // Gestion des erreurs de validation class-validator
        if (Array.isArray(resp.message)) {
          message = 'Données invalides';
          details = this.formatValidationErrors(resp.message as string[]);
        } else {
          message = (resp.message as string) || message;
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      // Erreur non-HTTP: logger en interne, ne pas exposer les détails
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
      
      // En dev, on peut exposer plus d'infos
      if (process.env.NODE_ENV === 'development') {
        message = exception.message;
      }
    }

    const errorResponse = {
      statusCode,
      error: HttpStatus[statusCode] || 'Error',
      message,
      ...(details ? { details } : {}),
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Logger les erreurs 5xx
    if (statusCode >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${statusCode}`, {
        body: request.body,
        params: request.params,
      });
    }

    response.status(statusCode).json(errorResponse);
  }

  private formatValidationErrors(messages: string[]): ValidationError[] {
    return messages.map((msg) => {
      // Essaye d'extraire le nom du champ du message class-validator
      const parts = msg.split(' ');
      return {
        field: parts[0] || 'unknown',
        message: msg,
      };
    });
  }
}
