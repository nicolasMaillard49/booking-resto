import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        CaptchaService,
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue('test-secret-32-chars-min-please!!') } },
      ],
    }).compile();
    service = moduleRef.get(CaptchaService);
  });

  describe('issue', () => {
    it('renvoie une question au format "a + b"', () => {
      const r = service.issue();
      expect(r.question).toMatch(/^\d+ \+ \d+$/);
    });

    it('renvoie un token au format "expected.expiresAt.sig"', () => {
      const r = service.issue();
      expect(r.token.split('.')).toHaveLength(3);
    });

    it('génère a et b entre 1 et 20 inclus', () => {
      for (let i = 0; i < 50; i++) {
        const r = service.issue();
        const [a, , b] = r.question.split(' ').map(Number);
        expect(a).toBeGreaterThanOrEqual(1);
        expect(a).toBeLessThanOrEqual(20);
        expect(b).toBeGreaterThanOrEqual(1);
        expect(b).toBeLessThanOrEqual(20);
      }
    });

    it('expiresAt = now + 10 minutes (à 100ms près)', () => {
      const before = Date.now();
      const r = service.issue();
      const expiresAt = parseInt(r.token.split('.')[1], 10);
      expect(expiresAt - before).toBeGreaterThanOrEqual(10 * 60_000 - 100);
      expect(expiresAt - before).toBeLessThanOrEqual(10 * 60_000 + 100);
    });
  });

  describe('verify', () => {
    it('accepte une bonne réponse', () => {
      const r = service.issue();
      const [a, , b] = r.question.split(' ').map(Number);
      expect(service.verify(r.token, String(a + b))).toBe(true);
    });

    it('refuse une mauvaise réponse', () => {
      const r = service.issue();
      expect(service.verify(r.token, '0')).toBe(false);
    });

    it('refuse un token corrompu (signature invalide)', () => {
      const r = service.issue();
      const [exp, expiresAt] = r.token.split('.');
      const tampered = `${exp}.${expiresAt}.aaaaaaaaaaaaaaaa`;
      const [a, , b] = r.question.split(' ').map(Number);
      expect(service.verify(tampered, String(a + b))).toBe(false);
    });

    it('refuse un token avec moins de 3 parts', () => {
      expect(service.verify('only.two', '5')).toBe(false);
      expect(service.verify('one', '5')).toBe(false);
    });

    it('refuse un token avec plus de 3 parts', () => {
      expect(service.verify('a.b.c.d', '5')).toBe(false);
    });

    it('refuse un token expiré', () => {
      // Forge un token avec expiresAt dans le passé
      const expected = '5';
      const expiresAt = Date.now() - 1000;
      const { createHmac } = require('node:crypto');
      const sig = createHmac('sha256', 'test-secret-32-chars-min-please!!')
        .update(`${expected}.${expiresAt}`).digest('hex').slice(0, 16);
      const expired = `${expected}.${expiresAt}.${sig}`;
      expect(service.verify(expired, '5')).toBe(false);
    });

    it('trim les espaces dans la réponse', () => {
      const r = service.issue();
      const [a, , b] = r.question.split(' ').map(Number);
      expect(service.verify(r.token, `  ${a + b}  `)).toBe(true);
    });

    it('compare answer en string (gère les types)', () => {
      const r = service.issue();
      const [a, , b] = r.question.split(' ').map(Number);
      expect(service.verify(r.token, String(a + b))).toBe(true);
      // Si on passe un nombre par accident, le service le convertit aussi
      expect(service.verify(r.token, (a + b) as unknown as string)).toBe(true);
    });

    it('refuse un token vide', () => {
      expect(service.verify('', '5')).toBe(false);
    });

    it('refuse une signature tronquée', () => {
      const r = service.issue();
      const [exp, expiresAt, sig] = r.token.split('.');
      const truncated = `${exp}.${expiresAt}.${sig.slice(0, 8)}`;
      const [a, , b] = r.question.split(' ').map(Number);
      expect(service.verify(truncated, String(a + b))).toBe(false);
    });
  });
});
