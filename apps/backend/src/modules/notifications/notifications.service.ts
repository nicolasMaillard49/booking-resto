// ============================================================
// NotificationsService — Emails transactionnels
// Nodemailer + templates HTML inline
// ============================================================

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { siteConfig } from '@booking-pro/shared';

interface BookingEmailData {
  id: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: Date;
  duration: number;
  cancelToken: string;
  notes?: string | null;
  service: { name: string; price: number };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get<string>('SMTP_HOST', 'localhost'),
      port: config.get<number>('SMTP_PORT', 1025),
      secure: config.get<string>('SMTP_SECURE', 'false') === 'true',
      auth:
        config.get('SMTP_USER')
          ? {
              user: config.get<string>('SMTP_USER'),
              pass: config.get<string>('SMTP_PASS'),
            }
          : undefined,
    });
  }

  /** Email de confirmation envoyé au client après réservation */
  async sendBookingConfirmation(booking: BookingEmailData): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3100');
    const cancelUrl = `${frontendUrl}/reservation/annuler/${booking.cancelToken}`;
    const dateFormatted = this.formatDate(booking.date);
    const timeFormatted = this.formatTime(booking.date);
    const brand = siteConfig.branding.primaryColor;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc; color: #1e293b;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="text-align: center; margin-bottom: 24px;">
      <h1 style="color: ${brand}; font-size: 24px; margin: 0;">Réservation confirmée</h1>
      <p style="color: #64748b; margin-top: 8px;">Votre rendez-vous a bien été enregistré</p>
    </div>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h2 style="margin: 0 0 16px; font-size: 18px;">${siteConfig.name}</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #64748b;">Prestation</td><td style="padding: 6px 0; font-weight: 600;">${booking.service.name}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="padding: 6px 0; font-weight: 600;">${dateFormatted}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Heure</td><td style="padding: 6px 0; font-weight: 600;">${timeFormatted}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Durée</td><td style="padding: 6px 0;">${booking.duration} min</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Prix</td><td style="padding: 6px 0;">${booking.service.price} &euro;</td></tr>
      </table>
    </div>

    ${booking.notes ? `<p style="background: #fef9c3; border-left: 4px solid #eab308; padding: 12px 16px; border-radius: 4px; margin: 16px 0;"><strong>Note:</strong> ${booking.notes}</p>` : ''}

    <p style="color: #64748b; font-size: 14px; margin-top: 24px;">
      Besoin d'annuler ? Vous pouvez le faire jusqu'à 2h avant votre rendez-vous via le lien ci-dessous.
    </p>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${cancelUrl}" style="background: #ef4444; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">Annuler ce rendez-vous</a>
    </div>

    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
    <p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">
      ${siteConfig.name} &mdash; ${siteConfig.contact.address}, ${siteConfig.contact.city}
    </p>
  </div>
</body>
</html>`;

    await this.sendEmail({
      to: booking.clientEmail,
      subject: `Réservation confirmée — ${booking.service.name} le ${dateFormatted}`,
      html,
    });
  }

  /** Email envoyé à l'admin lors d'une nouvelle réservation */
  async sendNewBookingToAdmin(booking: BookingEmailData): Promise<void> {
    const frontendUrl = this.config.get<string>('FRONTEND_URL', 'http://localhost:3100');
    const dateFormatted = this.formatDate(booking.date);
    const timeFormatted = this.formatTime(booking.date);
    const brand = siteConfig.branding.primaryColor;

    const html = `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="color: ${brand}; font-size: 20px;">Nouvelle réservation</h1>

    <div style="background: #f1f5f9; border-radius: 8px; padding: 20px; margin: 16px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 6px 0; color: #64748b;">Client</td><td style="padding: 6px 0; font-weight: 600;">${booking.clientName}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Email</td><td style="padding: 6px 0;">${booking.clientEmail}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Téléphone</td><td style="padding: 6px 0;">${booking.clientPhone}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Prestation</td><td style="padding: 6px 0; font-weight: 600;">${booking.service.name}</td></tr>
        <tr><td style="padding: 6px 0; color: #64748b;">Date</td><td style="padding: 6px 0; font-weight: 600;">${dateFormatted} à ${timeFormatted}</td></tr>
        ${booking.notes ? `<tr><td style="padding: 6px 0; color: #64748b;">Note</td><td style="padding: 6px 0; font-style: italic;">${booking.notes}</td></tr>` : ''}
      </table>
    </div>

    <div style="text-align: center; margin-top: 20px;">
      <a href="${frontendUrl}/admin/reservations" style="background: ${brand}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none;">Voir dans l'admin</a>
    </div>
  </div>
</body>
</html>`;

    await this.sendEmail({
      to: siteConfig.contact.email,
      subject: `Nouveau RDV: ${booking.clientName} — ${dateFormatted} à ${timeFormatted}`,
      html,
    });
  }

  /** Email d'annulation envoyé au client et à l'admin */
  async sendCancellationEmail(booking: BookingEmailData): Promise<void> {
    const dateFormatted = this.formatDate(booking.date);
    const timeFormatted = this.formatTime(booking.date);

    const clientHtml = `
<!DOCTYPE html>
<html lang="fr">
<body style="font-family: -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8fafc;">
  <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <h1 style="color: #ef4444; font-size: 20px;">Réservation annulée</h1>
    <p>Votre rendez-vous du <strong>${dateFormatted} à ${timeFormatted}</strong> pour <strong>${booking.service.name}</strong> a bien été annulé.</p>
    <p style="color: #64748b;">Pour reprendre rendez-vous, rendez-vous sur notre site.</p>
  </div>
</body>
</html>`;

    await Promise.all([
      this.sendEmail({
        to: booking.clientEmail,
        subject: `Annulation — ${booking.service.name} le ${dateFormatted}`,
        html: clientHtml,
      }),
      this.sendEmail({
        to: siteConfig.contact.email,
        subject: `RDV annulé: ${booking.clientName} — ${dateFormatted} à ${timeFormatted}`,
        html: `<p>${booking.clientName} a annulé son RDV du ${dateFormatted} à ${timeFormatted} (${booking.service.name}).</p>`,
      }),
    ]);
  }

  private async sendEmail(options: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    const from = this.config.get<string>('EMAIL_FROM', `${siteConfig.name} <noreply@example.fr>`);
    try {
      await this.transporter.sendMail({ from, ...options });
      this.logger.log(`Email envoyé à ${options.to}: ${options.subject}`);
    } catch (error) {
      this.logger.error(`Erreur envoi email à ${options.to}: ${error}`);
      throw error;
    }
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Paris',
    }).format(date);
  }

  private formatTime(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Paris',
    }).format(date);
  }
}
