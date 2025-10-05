import Logger from "@/logger";
import { getPublicKey, getPrivateKey, analyzeKey } from "@/key";
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

