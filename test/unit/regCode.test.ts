import { describe, test, expect, beforeEach, vi } from 'vitest';
import { verifyRegCodeAndResolveUser } from '@/services/auth/regCode';
import prisma from '@/prisma';

// Prismaのモック
vi.mock('@/prisma', () => ({
  default: {
    registrationCode: {
      findUnique: vi.fn(),
    },
  },
}));

describe('Registration Code Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('verifyRegCodeAndResolveUser', () => {
    test('有効な登録コードでユーザー情報を取得できる', async () => {
      const mockRegistrationCode = {
        code: 'REG123456',
        user: {
          id: 'user-456',
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      (prisma.registrationCode.findUnique as any).mockResolvedValue(mockRegistrationCode);

      const result = await verifyRegCodeAndResolveUser('REG123456');

      expect(prisma.registrationCode.findUnique).toHaveBeenCalledWith({
        where: { code: 'REG123456' },
        include: { user: true },
      });
      expect(result).toEqual(mockRegistrationCode.user);
    });

    test('存在しない登録コードでnullを返す', async () => {
      (prisma.registrationCode.findUnique as any).mockResolvedValue(null);

      const result = await verifyRegCodeAndResolveUser('INVALID_CODE');

      expect(result).toBeNull();
    });

    test('登録コードは存在するがユーザーが紐づいていない場合もnullを返す', async () => {
      const mockRegistrationCode = {
        code: 'REG123456',
        user: null,
      };

      (prisma.registrationCode.findUnique as any).mockResolvedValue(mockRegistrationCode);

      const result = await verifyRegCodeAndResolveUser('REG123456');

      expect(result).toBeNull();
    });

    test('データベースエラーが発生した場合にエラーを投げる', async () => {
      const error = new Error('Database connection failed');
      (prisma.registrationCode.findUnique as any).mockRejectedValue(error);

      await expect(verifyRegCodeAndResolveUser('REG123456')).rejects.toThrow('Database connection failed');
    });

    test('空の登録コードでnullを返す', async () => {
      (prisma.registrationCode.findUnique as any).mockResolvedValue(null);

      const result = await verifyRegCodeAndResolveUser('');

      expect(result).toBeNull();
    });
  });
});
