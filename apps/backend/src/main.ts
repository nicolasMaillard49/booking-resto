// ============================================================
// Booking Pro — Point d'entrée NestJS
// ============================================================

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ── Sécurité ─────────────────────────────────────────────
  // CORP `cross-origin` pour autoriser les images servies cross-port (3101 → 3100 en dev)
  // CSP `frame-ancestors *` : permet l'embed iframe des PDFs depuis le frontend (port différent)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'frame-ancestors': ["'self'", 'http://localhost:*', '*'],
        },
      },
    }),
  );

  // CORS: en dev on autorise tous les localhost (Nuxt prend parfois un port
  // fallback 3002/3003/…), en prod on ne laisse passer que FRONTEND_URL.
  const frontendUrl = configService.get<string>('FRONTEND_URL', 'http://localhost:3100');
  const isDev = configService.get<string>('NODE_ENV') !== 'production';
  app.enableCors({
    origin: isDev ? /^http:\/\/localhost:\d+$/ : [frontendUrl],
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'PUT', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ── Validation globale ────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,        // Supprime les propriétés non déclarées dans le DTO
      forbidNonWhitelisted: true, // Erreur si propriétés inconnues
      transform: true,        // Transforme les types automatiquement
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Filtres et intercepteurs globaux ─────────────────────
  // Ordre important : Prisma filter en premier (plus spécifique), HTTP en fallback
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  // ── Swagger ───────────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Booking Pro API')
    .setDescription('API REST — Système de réservation en ligne pour artisans et prestataires')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth', 'Authentification')
    .addTag('businesses', 'Gestion des businesses')
    .addTag('services', 'Gestion des services')
    .addTag('bookings', 'Réservations')
    .addTag('reviews', 'Avis clients')
    .addTag('availability', 'Disponibilités')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // ── Health check rapide ───────────────────────────────────
  // (health check complet géré dans AppController)

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);

  console.log(`🚀 Backend démarré sur http://localhost:${port}`);
  console.log(`📚 Swagger: http://localhost:${port}/api/docs`);
  console.log(`🏥 Health: http://localhost:${port}/health`);
}

bootstrap();
