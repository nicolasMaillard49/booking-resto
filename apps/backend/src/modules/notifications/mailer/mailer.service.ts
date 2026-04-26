import { Inject, Injectable } from '@nestjs/common';
import { IMailerProvider, MailPayload } from './types';

export const MAILER_PROVIDER = 'MAILER_PROVIDER';

@Injectable()
export class MailerService {
  constructor(@Inject(MAILER_PROVIDER) private provider: IMailerProvider) {}

  send(payload: MailPayload) {
    return this.provider.send(payload);
  }
}
