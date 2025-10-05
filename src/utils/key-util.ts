import { createHash, createPrivateKey, createPublicKey } from 'node:crypto';
import { SignKey } from '@/interfaces/SignKey';

async function analyzeKey(key: string): Promise<SignKey> {
  const privateKeyObj = createPrivateKey(key);
  const publicKeyObj = createPublicKey(key);

  const details = privateKeyObj.asymmetricKeyDetails;

  // Generate SHA-256 fingerprint of the public key
  const publicKeyDer = publicKeyObj.export({ format: 'der', type: 'spki' });

  const signKey: Partial<SignKey> = {
    privateKey: privateKeyObj.export({ format: 'pem', type: 'pkcs8' }).toString(),
    publicKey: publicKeyObj.export({ format: 'pem', type: 'spki' }).toString(),
    fingerprint: createHash('sha256').update(publicKeyDer).digest('hex').toUpperCase().match(/.{1,2}/g)?.join(':') || '',
  }

  switch (privateKeyObj.asymmetricKeyType) {
    case 'rsa':
      // Key type
      signKey.keyType = 'rsa';

      // Determine appropriate RSA signing algorithm based on key size
      const modulusLength = details?.modulusLength;

      if (!modulusLength) {
        throw new Error('Unable to determine RSA modulus length');
      }

      if (modulusLength >= 4096) {
        signKey.cryptoAlgorithm = 'RS512';
      } else if (modulusLength >= 2048) {
        signKey.cryptoAlgorithm = 'RS256';
      } else if (modulusLength >= 1024) {
        signKey.cryptoAlgorithm = 'RS256'; // Minimum recommended
      } else {
        throw new Error(`Unsupported RSA key size: ${modulusLength}`);
      }

      // Set modulusLength in info
      signKey.modulusLength = modulusLength;

      break;
    case 'ec':
      // Key type
      signKey.keyType = 'ec';

      // Determine appropriate EC signing algorithm based on named curve
      const namedCurve = details?.namedCurve;
      if (!namedCurve) {
        throw new Error('Unable to determine EC named curve');
      }

      if (namedCurve === 'secp256k1' || namedCurve === 'prime256v1') {
        signKey.cryptoAlgorithm = 'ES256';
      } else if (namedCurve === 'secp384r1') {
        signKey.cryptoAlgorithm = 'ES384';
      } else if (namedCurve === 'secp521r1') {
        signKey.cryptoAlgorithm = 'ES512';
      } else {
        throw new Error(`Unsupported EC named curve: ${namedCurve}`);
      }

      // Set namedCurve in info
      signKey.namedCurve = namedCurve;

      break;

    default:
      throw new Error(`Unsupported key type: ${privateKeyObj.asymmetricKeyType}`);
      // Defaultに流れることはありえない(そもそもkeyTypeがrsaとec以外許容しないため)
  }

  return signKey as SignKey;
}

export { analyzeKey };
