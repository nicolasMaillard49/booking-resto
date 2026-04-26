import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: { user: { findUnique: jest.Mock; update: jest.Mock } };
  let jwt: { sign: jest.Mock; verify: jest.Mock };
  let config: { get: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };
    jwt = {
      sign: jest.fn().mockReturnValue('signed-token'),
      verify: jest.fn(),
    };
    config = {
      get: jest.fn((key: string, def?: string) => {
        const map: Record<string, string> = {
          JWT_SECRET: 'access-secret',
          JWT_REFRESH_SECRET: 'refresh-secret',
          JWT_EXPIRES_IN: '1h',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return map[key] ?? def;
      }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwt },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('login', () => {
    const baseDto = { email: 'Admin@Example.fr', password: 'Admin1234!' };

    it('throws UnauthorizedException when user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.login(baseDto)).rejects.toBeInstanceOf(UnauthorizedException);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@example.fr' },
      });
    });

    it('throws UnauthorizedException when password is wrong', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'admin@example.fr',
        passwordHash: await bcrypt.hash('correct', 4),
        role: 'ADMIN',
      });

      await expect(service.login(baseDto)).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns token pair and updates lastLoginAt on success', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'admin@example.fr',
        passwordHash: await bcrypt.hash('Admin1234!', 4),
        role: 'ADMIN',
      });
      prisma.user.update.mockResolvedValue({});

      const tokens = await service.login(baseDto);

      expect(tokens).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
        expiresIn: 3600,
      });
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u1' },
        data: { lastLoginAt: expect.any(Date) },
      });
      const calls = jwt.sign.mock.calls;
      expect(calls[0][1].secret).toBe('access-secret');
      expect(calls[1][1].secret).toBe('refresh-secret');
    });
  });

  describe('refresh', () => {
    it('throws UnauthorizedException when token is invalid', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('bad-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws UnauthorizedException when user no longer exists', async () => {
      jwt.verify.mockReturnValue({ sub: 'u1', email: 'admin@example.fr', role: 'ADMIN' });
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.refresh('valid-token')).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns new token pair when refresh token is valid', async () => {
      jwt.verify.mockReturnValue({ sub: 'u1', email: 'admin@example.fr', role: 'ADMIN' });
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'admin@example.fr',
        role: 'ADMIN',
      });

      const tokens = await service.refresh('valid-token');

      expect(tokens).toEqual({
        accessToken: 'signed-token',
        refreshToken: 'signed-token',
        expiresIn: 3600,
      });
      expect(jwt.verify).toHaveBeenCalledWith('valid-token', { secret: 'refresh-secret' });
    });
  });
});
