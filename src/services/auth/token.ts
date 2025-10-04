import { TokenClaims } from "@/schemas/tokenClaimsSchema";
import jwt from "jsonwebtoken";
import { getPrivateKey } from "@/key";
import Logger from "@/logger";

// Logger instance for this module
const logger = new Logger('service', 'auth', 'token');

async function issueToken(payload: TokenClaims) {
  const privateKey = await getPrivateKey();
  logger.debug('Issuing token for user: ' + payload.sub);
  return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
}

async function verifyToken(token: string): Promise<TokenClaims | null> {
  const publicKey = await getPrivateKey();
  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    logger.debug('Token verified successfully');
    return decoded as TokenClaims;
  } catch (err) {
    logger.warn('Token verification failed: ' + (err as Error).message);
    return null;
  }
}

export { issueToken, verifyToken };
