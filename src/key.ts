import fs from 'fs';
import { EnvKey, EnvUtil } from './utils/env-util';

// keep key as a singleton
const keyCache: { privateKey?: string; publicKey?: string } = {};

async function getPrivateKey(): Promise<string> {
  if (!keyCache.privateKey) {
    keyCache.privateKey = await loadKey(EnvUtil.get(EnvKey.TOKEN_PRIVATE_KEY_PATH));
  }

  return keyCache.privateKey;
}

async function getPublicKey(): Promise<string> {
  if (!keyCache.publicKey) {
    keyCache.publicKey = await loadKey(EnvUtil.get(EnvKey.TOKEN_PUBLIC_KEY_PATH));
  }

  return keyCache.publicKey;
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

export { getPrivateKey, getPublicKey };
