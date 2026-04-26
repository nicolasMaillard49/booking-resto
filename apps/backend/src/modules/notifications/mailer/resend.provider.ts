import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { IMailerProvider, MailPayload } from './types';

@Injectable()
export class ResendProvider implements IMailerProvider {
  private readonly logger = new Logger(ResendProvider.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(config: ConfigService) {
    const key = config.get<string>('RESEND_API_KEY');
    if (!key) throw new Error('RESEND_API_KEY manquant en production');
    this.client = new Resend(key);
    this.from = config.get('MAIL_FROM') ?? '';
    if (!this.from) throw new Error('MAIL_FROM manquant en production');
  }

  async send(payload: MailPayload): Promise<void> {
    const { error, data } = await this.client.emails.send({
      from: this.from,
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });
    if (error) {
      this.logger.error(`Resend send failed: ${JSON.stringify(error)}`);
      throw new InternalServerErrorException('Échec envoi email');
    }
    this.logger.log(`Mail Resend (${data?.id}) → ${payload.to}`);
  }
}
