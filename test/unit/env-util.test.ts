import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnvUtil, EnvKey } from '@/utils/env-util';

describe('EnvUtil', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // 環境変数をリセット
    process.env = { ...originalEnv };
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('get', () => {
    test('定義された環境変数の値を取得できる', () => {
      process.env.PORT = '8080';
      process.env.NODE_ENV = 'production';
      process.env.UID_LENGTH = '12';

      expect(EnvUtil.get(EnvKey.PORT)).toBe(8080);
      expect(EnvUtil.get(EnvKey.NODE_ENV)).toBe('production');
      expect(EnvUtil.get(EnvKey.UID_LENGTH)).toBe(12);
    });

    test('環境変数が未定義の場合、デフォルト値を返す', () => {
      delete process.env.PORT;
      delete process.env.NODE_ENV;
      delete process.env.UID_LENGTH;

      expect(EnvUtil.get(EnvKey.PORT)).toBe(3000);
      expect(EnvUtil.get(EnvKey.NODE_ENV)).toBe('development');
      expect(EnvUtil.get(EnvKey.UID_LENGTH)).toBe(8);
    });

    test('数値型の環境変数を正しくパースできる', () => {
      process.env.PORT = '8080';
      process.env.UID_LENGTH = '16';

      const port = EnvUtil.get(EnvKey.PORT);
      const uidLength = EnvUtil.get(EnvKey.UID_LENGTH);

      expect(typeof port).toBe('number');
      expect(typeof uidLength).toBe('number');
      expect(port).toBe(8080);
      expect(uidLength).toBe(16);
    });

    test('文字列型の環境変数を正しく取得できる', () => {
      process.env.JWT_SECRET = 'my-secret-key';
      process.env.CLIENT_ORIGIN = 'https://example.com';

      const jwtSecret = EnvUtil.get(EnvKey.JWT_SECRET);
      const clientOrigin = EnvUtil.get(EnvKey.CLIENT_ORIGIN);

      expect(typeof jwtSecret).toBe('string');
      expect(typeof clientOrigin).toBe('string');
      expect(jwtSecret).toBe('my-secret-key');
      expect(clientOrigin).toBe('https://example.com');
    });

    test('ブール型の環境変数を正しくパースできる', () => {
      process.env.PLACEHOLDER_BOOL = 'true';

      const placeholderBool = EnvUtil.get(EnvKey.PLACEHOLDER_BOOL);

      expect(typeof placeholderBool).toBe('boolean');
      expect(placeholderBool).toBe(true);
    });

    test('無効な数値でエラーを投げる', () => {
      process.env.PORT = 'invalid-number';

      expect(() => EnvUtil.get(EnvKey.PORT)).toThrow('Env PORT must be a number, but got "invalid-number"');
    });

    test('無効なブール値でエラーを投げる', () => {
      process.env.PLACEHOLDER_BOOL = 'yes';

      expect(() => EnvUtil.get(EnvKey.PLACEHOLDER_BOOL)).toThrow('Env PLACEHOLDER_BOOL must be a boolean ("true"|"false"), but got "yes"');
    });

    test('NaNの数値でエラーを投げる', () => {
      process.env.PORT = 'NaN';

      expect(() => EnvUtil.get(EnvKey.PORT)).toThrow('Env PORT must be a number, but got "NaN"');
    });
  });

  describe('getUnsafe', () => {
    test('環境変数の値を取得できる', () => {
      process.env.CUSTOM_VAR = 'custom-value';

      const result = EnvUtil.getUnsafe('CUSTOM_VAR');

      expect(result).toBe('custom-value');
    });

    test('存在しない環境変数でundefinedを返す', () => {
      const result = EnvUtil.getUnsafe('NON_EXISTENT_VAR');

      expect(result).toBeUndefined();
    });

    test('空文字列の環境変数を取得できる', () => {
      process.env.EMPTY_VAR = '';

      const result = EnvUtil.getUnsafe('EMPTY_VAR');

      expect(result).toBe('');
    });
  });
});
