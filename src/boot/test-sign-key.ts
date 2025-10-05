import Logger from "@/logger";
import { getKey } from "@/key";


export const testSignKey = async () => {
  const keyLogger = new Logger('boot', 'key');
  keyLogger.info('Testing signing key pair...');
  try {

    const signKey = await getKey();
    keyLogger.info(`Signing Key Type: ${signKey.keyType}`);
    keyLogger.info(`Signing Algorithm: ${signKey.cryptoAlgorithm}`);
    keyLogger.info(`Public Key Fingerprint: ${signKey.fingerprint}`);

    keyLogger.success('Signing key pair loaded successfully');

  } catch (error) {
    keyLogger.error('Failed to load signing keys');
    keyLogger.debug('Error: ' + (error as Error).message);
    throw new Error('Signing key pair test failed');
  }
}

