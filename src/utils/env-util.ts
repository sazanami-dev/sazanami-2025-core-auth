/**
* a wrapper for process.env with type safety and default values
*/

// 未定義
export class NotDefinedEnvError extends Error {
  constructor(key: string) {
    super(`Environment variable ${key} is not defined.`);
    this.name = 'NotDefinedEnvError';
  }
}

// キャスト失敗
export class InvalidEnvTypeError extends Error {
  constructor(key: string, expectedType: string, actualValue: string) {
    super(`Environment variable ${key} is expected to be of type ${expectedType}, but got value: ${actualValue}`);
    this.name = 'InvalidEnvTypeError';
  }
}

function createEnvConfig<T extends Record<string, { type: 'string' | 'number' | 'boolean'; default: any }>>(config: T) {
  const keys = Object.keys(config).reduce((acc, key) => {
    (acc as any)[key] = key;
    return acc;
  }, {} as { [K in keyof T]: K });

  return { config, keys };
}

// 定義リスト
export const { config: envDefinitions, keys: EnvKey } = createEnvConfig({
  PORT: { type: 'number', default: 3000 },
  NODE_ENV: { type: 'string', default: 'development' },
  PLACEHOLDER_BOOL: { type: 'boolean', default: false }, // 型エラーを吐いてしまうので
  UID_LENGTH: { type: 'number', default: 8 },
  JWT_SECRET: { type: 'string', default: 'your-secret' },
  CLIENT_ORIGIN: { type: 'string', default: 'http://localhost:5173' },
  ACCOUNT_INITIALIZATION_PAGE: { type: 'string', default: 'http://localhost:5173/init-account' },
  TOKEN_SIGN_KEY_PATH: { type: 'string', default: '/data/key/private.pem' },
  TOKEN_DEFAULT_EXPIRATION: { type: 'number', default: 60 * 60 * 24 * 1 }, // 1 day
  TOKEN_DEFAULT_ISSUER: { type: 'string', default: 'sazanami-core-auth' },
});

type EnvConfig = typeof envDefinitions;
export type EnvKey = keyof EnvConfig;
type EnvValueType<K extends EnvKey> =
  EnvConfig[K]['type'] extends 'string' ? string :
  EnvConfig[K]['type'] extends 'number' ? number :
  EnvConfig[K]['type'] extends 'boolean' ? boolean : never;

export class EnvUtil {
  /**
  * Get environment variable with type safety and default value.
  * @param key The environment variable key.
  * @returns The value of the environment variable, or the default value if not defined.
  */
  static get<K extends EnvKey>(key: K): EnvValueType<K> {
    const { type, default: def } = envDefinitions[key];
    const raw = process.env[key];
    if (raw == null) return def as EnvValueType<K>;

    switch (type) {
      case 'string':
        return raw as EnvValueType<K>;
      case 'number':
        const n = Number(raw);
        if (Number.isNaN(n)) {
          throw new Error(`Env ${key} must be a number, but got "${raw}"`);
        }
        return n as EnvValueType<K>;
      case 'boolean':
        if (raw === 'true' || raw === 'false') {
          return (raw === 'true') as EnvValueType<K>;
        }
        throw new Error(`Env ${key} must be a boolean ("true"|"false"), but got "${raw}"`);
      default:
        throw new Error('unreachable');
    }
  }

  /**
  * Get environment variable without type safety or default value.
  * @param key The environment variable key.
  * @returns The value of the environment variable, or undefined if not defined.
  */
  static getUnsafe(key: string): string | undefined {
    return process.env[key];
  }
}
