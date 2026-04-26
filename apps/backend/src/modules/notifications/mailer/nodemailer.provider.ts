import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { IMailerProvider, MailPayload } from './types';

@Injectable()
export class NodemailerProvider implements IMailerProvider {
  private readonly logger = new Logger(NodemailerProvider.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: config.get('SMTP_HOST', 'localhost'),
      port: parseInt(config.get('SMTP_PORT', '1025'), 10),
      secure: false,
      auth: config.get('SMTP_USER') ? { user: config.get('SMTP_USER'), pass: config.get('SMTP_PASS') } : undefined,
    });
    this.from = config.get('MAIL_FROM', 'reservation@booking-resto.local');
  }

  async send(payload: MailPayload): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.from,
        to: payload.to,
        subject: payload.subject,
        html: payload.html,
        text: payload.text,
      });
      this.logger.log(`Mail Nodemailer (${info.messageId}) → ${payload.to}`);
    } catch (e: any) {
      this.logger.error(`Échec envoi mail à ${payload.to}: ${e.message}`);
    }
  }
}
