import { describe, test, expect, beforeEach, vi } from 'vitest';
import { verifySessionIdAndResolveUser, createAnonymousSession } from '@/services/auth/session';
import prisma from '@/prisma';

// Prismaのモック
vi.mock('@/prisma', () => ({
  default: {
    session: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

describe('Session Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifySessionIdAndResolveUser', () => {
    test('有効なセッションIDでユーザー情報を取得できる', async () => {
      const mockSession = {
        id: 'session-123',
        user: {
          id: 'user-456',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (prisma.session.findUnique as any).mockResolvedValue(mockSession);

      const result = await verifySessionIdAndResolveUser('session-123');

      expect(prisma.session.findUnique).toHaveBeenCalledWith({
        where: { id: 'session-123' },
        include: { user: true },
      });
      expect(result).toEqual(mockSession.user);
    });

    test('存在しないセッションIDでnullを返す', async () => {
      (prisma.session.findUnique as any).mockResolvedValue(null);

      const result = await verifySessionIdAndResolveUser('invalid-session');

      expect(result).toBeNull();
    });

    test('セッションは存在するがユーザーが紐づいていない場合もnullを返す', async () => {
      const mockSession = {
        id: 'session-123',
        user: null,
      };

      (prisma.session.findUnique as any).mockResolvedValue(mockSession);

      const result = await verifySessionIdAndResolveUser('session-123');

      expect(result).toBeNull();
    });
  });

  describe('createAnonymousSession', () => {
    test('新しい匿名セッションを作成できる', async () => {
      const mockSession = {
        id: 'new-session-123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.session.create as any).mockResolvedValue(mockSession);

      const result = await createAnonymousSession();

      expect(prisma.session.create).toHaveBeenCalledWith({});
      expect(result).toEqual(mockSession);
    });

    test('データベースエラーが発生した場合にエラーを投げる', async () => {
      const error = new Error('Database connection failed');
      (prisma.session.create as any).mockRejectedValue(error);

      await expect(createAnonymousSession()).rejects.toThrow('Database connection failed');
    });
  });
});
