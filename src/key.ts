import fs from 'fs';
import { EnvKey, EnvUtil } from './utils/env-util';
import { SignKey } from './interfaces/SignKey';
import { analyzeKey } from './utils/key-util';

// keep key as a singleton
let keyCache: SignKey | null = null;


async function getKey(): Promise<SignKey> {
  if (keyCache) return keyCache;

  const key = loadKey(EnvUtil.get(EnvKey.TOKEN_SIGN_KEY_PATH));
  const signKey = await analyzeKey(await key);
  keyCache = signKey;
  return signKey;
}

async function loadKey(path: string): Promise<string> {
  let key;

  try {
    key = await fs.promises.readFile(path, 'utf-8');
  } catch (err) {
    throw new Error(`Failed to read key file at ${path}: ${(err as Error).message}`);
  }

  if (!key) {
    throw new Error(`Key file at ${path} is empty`);
  }

  return key;
}

export { getKey };
