import { TokenClaims } from "@/schemas/tokenClaimsSchema";
import jwt from "jsonwebtoken";
import Logger from "@/logger";
import { getKey } from "@/key";

// Logger instance for this module
const logger = new Logger('service', 'auth', 'token');

async function issueToken(payload: TokenClaims) {
  const signKey = await getKey();

  logger.debug('Issuing token for user: ' + payload.sub);
  return jwt.sign(payload, signKey.privateKey, { algorithm: signKey.cryptoAlgorithm });
}

async function verifyToken(token: string): Promise<TokenClaims | null> {
  const signKey = await getKey();
  try {
    const decoded = jwt.verify(token, signKey.publicKey, { algorithms: [signKey.cryptoAlgorithm] });

    logger.debug('Token verified successfully');
    return decoded as TokenClaims;
  } catch (err) {
    logger.warn('Token verification failed: ' + (err as Error).message);
    return null;
  }
}

export { issueToken, verifyToken };
