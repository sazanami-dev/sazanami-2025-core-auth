import fs from 'fs';
import { EnvKey, EnvUtil } from './utils/env-util';
import { KeyInfo } from './interfaces/KeyInfo';
import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';

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

async function analyzeKey(key: string, isPrivate: boolean): Promise<any> {
  const keyObj = isPrivate ? createPrivateKey(key) : createPublicKey(key);
  const details = keyObj.asymmetricKeyDetails;
  let fingerprint: string | undefined;

  if (!isPrivate) {
    const der = keyObj.export({ type: 'spki', format: 'der' }) as Buffer;
    const hash = createHash('sha256').update(der).digest('hex');
    fingerprint = hash.match(/.{1,2}/g)?.join(':');
  }

  const info: KeyInfo = {
    type: isPrivate ? 'private' : 'public',
    keyType: keyObj.asymmetricKeyType as 'rsa' | 'ec',
    fingerprint,
    cryptoAlgorithm: '', // to be determined below
  };

  switch (keyObj.asymmetricKeyType) {
    case 'rsa':

      // Determine appropriate RSA signing algorithm based on key size

      const modulusLength = details?.modulusLength;

      if (!modulusLength) {
        throw new Error('Unable to determine RSA modulus length');
      }

      if (modulusLength >= 4096) {
        info.cryptoAlgorithm = 'RS512';
      } else if (modulusLength >= 2048) {
        info.cryptoAlgorithm = 'RS256';
      } else if (modulusLength >= 1024) {
        info.cryptoAlgorithm = 'RS256'; // Minimum recommended
      } else {
        throw new Error(`Unsupported RSA key size: ${modulusLength}`);
      }

      // Set modulusLength in info
      info.modulusLength = modulusLength;

      break;
    case 'ec':

      // Determine appropriate EC signing algorithm based on named curve

      const namedCurve = details?.namedCurve;
      if (!namedCurve) {
        throw new Error('Unable to determine EC named curve');
      }

      if (namedCurve === 'secp256k1' || namedCurve === 'prime256v1') {
        info.cryptoAlgorithm = 'ES256';
      } else if (namedCurve === 'secp384r1') {
        info.cryptoAlgorithm = 'ES384';
      } else if (namedCurve === 'secp521r1') {
        info.cryptoAlgorithm = 'ES512';
      } else {
        throw new Error(`Unsupported EC named curve: ${namedCurve}`);
      }

      // Set namedCurve in info
      info.namedCurve = namedCurve;

      break;
    default:
      throw new Error(`Unsupported key type: ${keyObj.asymmetricKeyType}`);
  }
  return info;
}

export { getPrivateKey, getPublicKey, analyzeKey };
