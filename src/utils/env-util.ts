/**
* a wrapper for process.env with type safety and default values
*/

// 環境変数のキー, 型, デフォルト値の定義
interface EnvType {
  key: string;
  type: 'string' | 'number' | 'boolean';
  default: string | number | boolean;
}

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

// 定義リスト
export const envDefinitions: EnvType[] = [
  {
    key: 'PORT',
    type: 'number',
    default: 3000,
  },
]

export class EnvUtil {

  /**
  * Get environment variable with type safety and default value.
  * @param key The environment variable key.
  * @returns The value of the environment variable, or the default value if not defined.
  */
  public static get<T>(key: string): T {
    const definition = envDefinitions.find(def => def.key === key);
    if (!definition) {
      throw new NotDefinedEnvError(key);
    }

    const value = process.env[key];
    if (value === undefined) {
      return definition.default as T;
    }
    switch (definition.type) {
      case 'string':
        return value as unknown as T;
      case 'number':
        const num = Number(value);
        if (isNaN(num)) {
          throw new InvalidEnvTypeError(key, 'number', value);
        }
        return num as unknown as T;
      case 'boolean':
        if (value.toLowerCase() === 'true') {
          return true as unknown as T;
        } else if (value.toLowerCase() === 'false') {
          return false as unknown as T;
        } else {
          throw new InvalidEnvTypeError(key, 'boolean', value);
        }
      default:
        throw new Error(`Unsupported type for environment variable ${key}`);
    }
  }
  
  /**
  * Get environment variable without type safety and default value.
  * @param key The environment variable key.
  * @returns The value of the environment variable, or undefined if not defined.
  */
  public static getUnsafe(key: string): string | undefined {
    return process.env[key];
  }

  // NODE_ENVがproductionかどうか
  public static isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }
}
