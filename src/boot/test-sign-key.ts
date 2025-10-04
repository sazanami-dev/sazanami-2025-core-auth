import Logger from "@/logger";
import { getPublicKey, getPrivateKey } from "@/key";
import { createPublicKey, createPrivateKey, createHash, sign, verify, constants as cryptoConstants } from "node:crypto";

export const testSignKey = async () => {
  const keyLogger = new Logger('boot', 'key');
  keyLogger.info('Testing signing key pair...');
  try {
    const privateKey = await getPrivateKey();
    const publicKey = await getPublicKey();

    const privateKeyInfo = await analyzeKey(privateKey, true);
    const publicKeyInfo = await analyzeKey(publicKey, false);

    keyLogger.info(`Private Key: Type=${privateKeyInfo.asymmetricKeyType}, Size=${privateKeyInfo.modulusLength || privateKeyInfo.namedCurve}`);
    keyLogger.info(`Public Key: Type=${publicKeyInfo.asymmetricKeyType}, Size=${publicKeyInfo.modulusLength || publicKeyInfo.namedCurve}`);
    keyLogger.debug(`Public Key Fingerprint: ${publicKeyInfo.fingerprint}`);

    // 署名テスト
    // TODO: 鍵の種類に応じた署名アルゴリズムの選択, そもそも署名/検証処理自体をヘルパーに切り出す
    const testData = 'test data for signing';
    const signature = sign('sha256', Buffer.from(testData), {
      key: privateKey,
      padding: privateKeyInfo.asymmetricKeyType === 'rsa' ? (cryptoConstants.RSA_PKCS1_PSS_PADDING) : undefined,
    });
    const isVerified = verify('sha256', Buffer.from(testData), {
      key: publicKey,
      padding: publicKeyInfo.asymmetricKeyType === 'rsa' ? (cryptoConstants.RSA_PKCS1_PSS_PADDING) : undefined,
    }, signature);

    if (!isVerified) {
      keyLogger.error('Signature verification failed');
      throw new Error('Signing key pair test failed');
    }

    keyLogger.success('Signing key pair is valid and working');

  } catch (error) {
    keyLogger.error('Failed to load signing keys');
    keyLogger.debug('Error: ' + (error as Error).message);
    throw new Error('Signing key pair test failed');
  }
}

const analyzeKey = async (key: string, isPrivate: boolean): Promise<KeyInfo> => {
  // Cryptoモジュールを使って鍵の情報を解析する
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
    asymmetricKeyType: keyObj.asymmetricKeyType,
    fingerprint,
  };

  if (details) {
    if (keyObj.asymmetricKeyType === 'rsa') {
      info.modulusLength = details.modulusLength;
    } else if (keyObj.asymmetricKeyType === 'ec') {
      info.namedCurve = details.namedCurve;
    }
  }

  return info;
}

interface KeyInfo {
  type: 'private' | 'public';
  asymmetricKeyType: string | undefined;
  modulusLength?: number; // RSA specific
  namedCurve?: string; // EC specific
  fingerprint?: string; // SHA-256 fingerprint
}

