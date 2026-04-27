export type EmailTemplate =
  | 'booking-confirmed'
  | 'booking-pending'
  | 'booking-admin-alert'
  | 'booking-confirmed-after-pending'
  | 'booking-cancelled-by-admin'
  | 'booking-cancelled-by-client'
  | 'booking-cancelled-admin-notify'
  | 'booking-reminder'
  | 'booking-review-request'
  | 'contact-message-alert';

export interface MailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface IMailerProvider {
  send(payload: MailPayload): Promise<void>;
}
