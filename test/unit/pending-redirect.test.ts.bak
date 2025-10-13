import { describe, test, expect, beforeEach, vi } from 'vitest';
import { getPendingRedirect, createPendingRedirect } from '@/services/auth/pending-redirect';
import prisma from '@/prisma';

// Prismaのモック
vi.mock('@/prisma', () => ({
  default: {
    pendingRedirect: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Pending Redirect Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getPendingRedirect', () => {
    test('セッションIDで保留中のリダイレクト情報を取得できる', async () => {
      const mockPendingRedirect = {
        id: 'redirect-123',
        sessionId: 'session-456',
        redirectUrl: 'https://example.com/callback',
        postbackUrl: 'https://api.example.com/webhook',
        state: 'random-state-123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        createdAt: new Date(),
      };

      (prisma.pendingRedirect.findFirst as any).mockResolvedValue(mockPendingRedirect);

      const result = await getPendingRedirect('session-456');

      expect(prisma.pendingRedirect.findFirst).toHaveBeenCalledWith({
        where: { sessionId: 'session-456' },
      });
      expect(result).toEqual(mockPendingRedirect);
    });

    test('存在しないセッションIDでnullを返す', async () => {
      (prisma.pendingRedirect.findFirst as any).mockResolvedValue(null);

      const result = await getPendingRedirect('invalid-session');

      expect(result).toBeNull();
    });

    test('データベースエラーが発生した場合にエラーを投げる', async () => {
      const error = new Error('Database connection failed');
      (prisma.pendingRedirect.findFirst as any).mockRejectedValue(error);

      await expect(getPendingRedirect('session-456')).rejects.toThrow('Database connection failed');
    });
  });

  describe('createPendingRedirect', () => {
    test('デフォルトの有効期限で保留中のリダイレクトを作成できる', async () => {
      const mockPendingRedirect = {
        id: 'redirect-123',
        sessionId: 'session-456',
        redirectUrl: 'https://example.com/callback',
        postbackUrl: 'https://api.example.com/webhook',
        state: 'random-state-123',
        expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes from now
        createdAt: new Date(),
      };

      (prisma.pendingRedirect.create as any).mockResolvedValue(mockPendingRedirect);

      const result = await createPendingRedirect(
        'session-456',
        'https://example.com/callback',
        'https://api.example.com/webhook',
        'random-state-123'
      );

      expect(prisma.pendingRedirect.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-456',
          redirectUrl: 'https://example.com/callback',
          postbackUrl: 'https://api.example.com/webhook',
          state: 'random-state-123',
          expiresAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockPendingRedirect);
    });

    test('カスタムの有効期限で保留中のリダイレクトを作成できる', async () => {
      const customExpiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      const mockPendingRedirect = {
        id: 'redirect-123',
        sessionId: 'session-456',
        redirectUrl: 'https://example.com/callback',
        postbackUrl: undefined,
        state: undefined,
        expiresAt: customExpiresAt,
        createdAt: new Date(),
      };

      (prisma.pendingRedirect.create as any).mockResolvedValue(mockPendingRedirect);

      const result = await createPendingRedirect(
        'session-456',
        'https://example.com/callback',
        undefined,
        undefined,
        customExpiresAt
      );

      expect(prisma.pendingRedirect.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-456',
          redirectUrl: 'https://example.com/callback',
          postbackUrl: undefined,
          state: undefined,
          expiresAt: customExpiresAt,
        },
      });
      expect(result).toEqual(mockPendingRedirect);
    });

    test('最小限の情報で保留中のリダイレクトを作成できる', async () => {
      const mockPendingRedirect = {
        id: 'redirect-123',
        sessionId: 'session-456',
        redirectUrl: undefined,
        postbackUrl: undefined,
        state: undefined,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
        createdAt: new Date(),
      };

      (prisma.pendingRedirect.create as any).mockResolvedValue(mockPendingRedirect);

      const result = await createPendingRedirect('session-456');

      expect(prisma.pendingRedirect.create).toHaveBeenCalledWith({
        data: {
          sessionId: 'session-456',
          redirectUrl: undefined,
          postbackUrl: undefined,
          state: undefined,
          expiresAt: expect.any(Date),
        },
      });
      expect(result).toEqual(mockPendingRedirect);
    });

    test('データベースエラーが発生した場合にエラーを投げる', async () => {
      const error = new Error('Database connection failed');
      (prisma.pendingRedirect.create as any).mockRejectedValue(error);

      await expect(createPendingRedirect('session-456')).rejects.toThrow('Database connection failed');
    });
  });
});
