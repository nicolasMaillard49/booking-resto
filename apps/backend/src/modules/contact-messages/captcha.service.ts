import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'node:crypto';

@Injectable()
export class CaptchaService {
  private readonly secret: string;
  constructor(config: ConfigService) {
    this.secret = config.get('JWT_SECRET') || 'change-me-32-chars-min!!';
  }

  issue(): { question: string; token: string } {
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    const expected = a + b;
    const expiresAt = Date.now() + 10 * 60_000;
    const payload = `${expected}.${expiresAt}`;
    const sig = createHmac('sha256', this.secret).update(payload).digest('hex').slice(0, 16);
    return { question: `${a} + ${b}`, token: `${payload}.${sig}` };
  }

  verify(token: string, answer: string): boolean {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const [expected, expiresAt, sig] = parts;
    const recomputed = createHmac('sha256', this.secret).update(`${expected}.${expiresAt}`).digest('hex').slice(0, 16);
    if (recomputed !== sig) return false;
    if (Number(expiresAt) < Date.now()) return false;
    return String(expected) === String(answer).trim();
  }
}
