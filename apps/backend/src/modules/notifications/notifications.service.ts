import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MailerService } from './mailer/mailer.service';
import { SettingsService } from '../settings/settings.service';
import { EmailTemplate } from './mailer/types';

const TEMPLATES_DIR = join(__dirname, 'templates');

function render(html: string, data: Record<string, any>): string {
  return html
    .replace(/\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g, (_, key, body) => data[key] ? body : '')
    .replace(/\{\{(\w+)\}\}/g, (_, key) => (data[key] ?? '').toString());
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly templates = new Map<EmailTemplate, string>();

  constructor(
    private mailer: MailerService,
    private settings: SettingsService,
    private config: ConfigService,
  ) {
    const names: EmailTemplate[] = [
      'booking-confirmed', 'booking-pending', 'booking-admin-alert',
      'booking-confirmed-after-pending', 'booking-cancelled-by-admin',
      'booking-cancelled-by-client', 'booking-cancelled-admin-notify',
      'booking-reminder', 'contact-message-alert',
    ];
    for (const n of names) {
      try { this.templates.set(n, readFileSync(join(TEMPLATES_DIR, `${n}.html`), 'utf8')); }
      catch { this.logger.warn(`Template ${n}.html introuvable`); }
    }
  }

  private async commonVars(): Promise<Record<string, any>> {
    return {
      brandName: await this.settings.getBrandName(),
      contactAddress: await this.settings.getContactAddress(),
      contactPhone: await this.settings.getContactPhone(),
      contactEmail: await this.settings.getContactEmail(),
      adminUrl: this.config.get('FRONTEND_URL', 'http://localhost:3100'),
    };
  }

  private bookingVars(b: any) {
    const date = new Date(b.date);
    return {
      id: b.id,
      clientName: b.clientName,
      clientEmail: b.clientEmail,
      clientPhone: b.clientPhone,
      partySize: b.partySize,
      notes: b.notes ?? '',
      dateFormatted: date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
      timeFormatted: date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      serviceWindowLabel: b.serviceWindow?.label ?? '',
      cancelUrl: `${this.config.get('FRONTEND_URL', 'http://localhost:3100')}/reservation/${b.cancelToken}/cancel`,
    };
  }

  private async sendTpl(tpl: EmailTemplate, to: string, subject: string, data: Record<string, any>) {
    if (!to) return;
    const html = this.templates.get(tpl);
    if (!html) { this.logger.warn(`Skip ${tpl}: template manquant`); return; }
    await this.mailer.send({ to, subject, html: render(html, data) });
  }

  async onBookingCreated(b: any) {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    if (b.status === 'CONFIRMED') {
      await this.sendTpl('booking-confirmed', b.clientEmail, `Réservation confirmée — ${common.brandName}`, vars);
    } else {
      await this.sendTpl('booking-pending', b.clientEmail, `Demande de réservation reçue — ${common.brandName}`, vars);
    }
    await this.sendTpl('booking-admin-alert', this.config.get('ADMIN_EMAIL', ''),
      `Nouvelle réservation : ${b.partySize} couverts le ${vars.dateFormatted}`, vars);
  }

  async onBookingConfirmedByAdmin(b: any) {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    await this.sendTpl('booking-confirmed-after-pending', b.clientEmail,
      `Réservation confirmée — ${common.brandName}`, vars);
  }

  async onBookingCancelled(b: any, by: 'admin' | 'client') {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    if (by === 'admin') {
      await this.sendTpl('booking-cancelled-by-admin', b.clientEmail,
        `Annulation de votre réservation — ${common.brandName}`, vars);
    } else {
      await this.sendTpl('booking-cancelled-by-client', b.clientEmail,
        `Annulation confirmée — ${common.brandName}`, vars);
      await this.sendTpl('booking-cancelled-admin-notify', this.config.get('ADMIN_EMAIL', ''),
        `Annulation client : ${b.clientName} le ${vars.dateFormatted}`, vars);
    }
  }

  async onBookingReminder(b: any) {
    const common = await this.commonVars();
    const vars = { ...common, ...this.bookingVars(b) };
    await this.sendTpl('booking-reminder', b.clientEmail,
      `Rappel : votre table demain à ${vars.timeFormatted} — ${common.brandName}`, vars);
  }

  async onContactMessage(m: { name: string; email: string; message: string }) {
    const common = await this.commonVars();
    await this.sendTpl('contact-message-alert', this.config.get('ADMIN_EMAIL', ''),
      `Nouveau message de ${m.name}`, { ...common, ...m });
  }
}
