import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { MailerService } from './mailer/mailer.service';
import { SettingsService } from '../settings/settings.service';
import { NotificationsService, BookingForEmail } from './notifications.service';

function makeBooking(over: Partial<BookingForEmail> = {}): BookingForEmail {
  return {
    id: 'b1',
    partySize: 4,
    date: new Date('2026-05-10T12:30:00Z'),
    serviceWindowId: 'w1',
    clientName: 'Alice',
    clientEmail: 'alice@example.fr',
    clientPhone: '0600000000',
    notes: null,
    status: 'CONFIRMED',
    cancelToken: 'cancel-tok',
    confirmToken: null,
    confirmedAt: new Date(),
    cancelledAt: null,
    reminderSentAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    serviceWindow: {
      id: 'w1', label: 'Service Midi',
      daysOfWeek: [2, 3, 4, 5, 6],
      startTime: '12:00', endTime: '14:00',
      isActive: true, sortOrder: 0,
      createdAt: new Date(), updatedAt: new Date(),
    },
    ...over,
  };
}

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mailer: { send: jest.Mock };
  let settings: any;
  let config: any;

  beforeEach(async () => {
    mailer = { send: jest.fn().mockResolvedValue(undefined) };
    settings = {
      getBrandName: jest.fn().mockResolvedValue('La Rencontre'),
      getContactAddress: jest.fn().mockResolvedValue('1 rue X'),
      getContactPhone: jest.fn().mockResolvedValue('05 00 00 00 00'),
      getContactEmail: jest.fn().mockResolvedValue('contact@x.fr'),
    };
    config = {
      get: jest.fn((k: string, def?: string) => {
        if (k === 'ADMIN_EMAIL') return 'admin@x.fr';
        if (k === 'FRONTEND_URL') return 'http://localhost:3100';
        return def ?? '';
      }),
    };
    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: MailerService, useValue: mailer },
        { provide: SettingsService, useValue: settings },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();
    service = moduleRef.get(NotificationsService);
  });

  describe('onBookingCreated', () => {
    it('envoie booking-confirmed au client si CONFIRMED', async () => {
      await service.onBookingCreated(makeBooking({ status: 'CONFIRMED' }));
      expect(mailer.send).toHaveBeenCalledTimes(2); // client + admin
      const subjects = mailer.send.mock.calls.map((c: any[]) => c[0].subject);
      expect(subjects.some((s: string) => /confirm/i.test(s))).toBe(true);
    });

    it('envoie booking-pending au client si PENDING', async () => {
      await service.onBookingCreated(makeBooking({ status: 'PENDING' }));
      const subjects = mailer.send.mock.calls.map((c: any[]) => c[0].subject);
      expect(subjects.some((s: string) => /demande/i.test(s))).toBe(true);
    });

    it('envoie alerte admin à ADMIN_EMAIL', async () => {
      await service.onBookingCreated(makeBooking());
      const tos = mailer.send.mock.calls.map((c: any[]) => c[0].to);
      expect(tos).toContain('admin@x.fr');
      expect(tos).toContain('alice@example.fr');
    });

    it('inclut nom de marque dans le subject client', async () => {
      await service.onBookingCreated(makeBooking());
      const clientSubject = mailer.send.mock.calls.find((c: any[]) => c[0].to === 'alice@example.fr')[0].subject;
      expect(clientSubject).toContain('La Rencontre');
    });

    it('skip mail admin si ADMIN_EMAIL absent', async () => {
      config.get.mockImplementation((k: string) => k === 'FRONTEND_URL' ? 'http://localhost:3100' : '');
      await service.onBookingCreated(makeBooking());
      const tos = mailer.send.mock.calls.map((c: any[]) => c[0].to);
      expect(tos).not.toContain('');
      expect(tos).toContain('alice@example.fr'); // mail client toujours envoyé
    });

    it('inclut cancelUrl avec FRONTEND_URL et cancelToken', async () => {
      await service.onBookingCreated(makeBooking({ cancelToken: 'abc123' }));
      const html = mailer.send.mock.calls[0][0].html;
      expect(html).toContain('http://localhost:3100/reservation/abc123/cancel');
    });

    it('rend les notes si présentes', async () => {
      await service.onBookingCreated(makeBooking({ notes: 'Anniversaire surprise' }));
      const html = mailer.send.mock.calls[0][0].html;
      expect(html).toContain('Anniversaire surprise');
    });

    it('escape les caractères HTML dans les variables (anti-XSS)', async () => {
      await service.onBookingCreated(makeBooking({ clientName: '<script>alert(1)</script>' }));
      const html = mailer.send.mock.calls[0][0].html;
      expect(html).not.toContain('<script>');
      expect(html).toContain('&lt;script&gt;');
    });
  });

  describe('onBookingConfirmedByAdmin', () => {
    it('envoie le template after-pending au client', async () => {
      await service.onBookingConfirmedByAdmin(makeBooking());
      expect(mailer.send).toHaveBeenCalledTimes(1);
      expect(mailer.send.mock.calls[0][0].to).toBe('alice@example.fr');
    });
  });

  describe('onBookingCancelled', () => {
    it('envoie cancelled-by-admin au client si by=admin', async () => {
      await service.onBookingCancelled(makeBooking(), 'admin');
      expect(mailer.send).toHaveBeenCalledTimes(1);
      const tos = mailer.send.mock.calls.map((c: any[]) => c[0].to);
      expect(tos).toEqual(['alice@example.fr']);
    });

    it('envoie cancelled-by-client au client + admin-notify si by=client', async () => {
      await service.onBookingCancelled(makeBooking(), 'client');
      expect(mailer.send).toHaveBeenCalledTimes(2);
      const tos = mailer.send.mock.calls.map((c: any[]) => c[0].to);
      expect(tos).toContain('alice@example.fr');
      expect(tos).toContain('admin@x.fr');
    });
  });

  describe('onBookingReminder', () => {
    it('envoie le template reminder', async () => {
      await service.onBookingReminder(makeBooking());
      expect(mailer.send).toHaveBeenCalledTimes(1);
      expect(mailer.send.mock.calls[0][0].subject).toMatch(/Rappel/i);
    });
  });

  describe('onContactMessage', () => {
    it('envoie une alerte au ADMIN_EMAIL', async () => {
      await service.onContactMessage({ name: 'Bob', email: 'bob@x.fr', message: 'Hello' });
      expect(mailer.send).toHaveBeenCalledTimes(1);
      expect(mailer.send.mock.calls[0][0].to).toBe('admin@x.fr');
      expect(mailer.send.mock.calls[0][0].subject).toContain('Bob');
    });

    it('inclut le message dans le HTML', async () => {
      await service.onContactMessage({ name: 'Bob', email: 'bob@x.fr', message: 'Hello world' });
      const html = mailer.send.mock.calls[0][0].html;
      expect(html).toContain('Hello world');
    });

    it('escape le HTML dans le message (anti-XSS)', async () => {
      await service.onContactMessage({ name: 'X', email: 'x@x.fr', message: '<img src=x onerror=alert(1)>' });
      const html = mailer.send.mock.calls[0][0].html;
      expect(html).not.toContain('<img src=x');
      expect(html).toContain('&lt;img');
    });

    it('skip si ADMIN_EMAIL absent', async () => {
      config.get.mockImplementation((_: string, def?: string) => def ?? '');
      await service.onContactMessage({ name: 'X', email: 'x@x.fr', message: 'Hi' });
      expect(mailer.send).not.toHaveBeenCalled();
    });
  });
});
