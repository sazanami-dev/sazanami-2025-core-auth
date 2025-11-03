import { TokenClaims } from "@/schemas/object/tokenClaims";
import jwt from "jsonwebtoken";
import Logger from "@/logger";
import { getKey } from "@/key";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { getUserWithSessionBySessionId } from "./user";
import { v4 as uuidv4 } from 'uuid';

// Logger instance for this module
const logger = new Logger('service', 'auth', 'token');

async function issueToken(payload: TokenClaims) {
  const signKey = await getKey();

  logger.debug('Issuing token for user: ' + payload.sub);
  // Include 'kid' in the header
  const kid = EnvUtil.get(EnvKey.TOKEN_SIGN_KEY_DEFAULT_KID);
  return jwt.sign(payload, signKey.privateKey, { algorithm: signKey.cryptoAlgorithm, header: { kid, alg: signKey.cryptoAlgorithm } });
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

function generateJti(): string {
  // Generate UUID v4 for jti
  return uuidv4();
}

async function makeClaimsHelper(sessionId: string, isAnonToken: boolean = false, expiresInSeconds?: number, audience?: string): Promise<TokenClaims> {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresInSeconds ?? EnvUtil.get(EnvKey.TOKEN_DEFAULT_EXPIRATION));
  const iss = EnvUtil.get(EnvKey.TOKEN_DEFAULT_ISSUER);

  const claims: Partial<TokenClaims> = {
    sub: sessionId,
    iss,
    exp,
    iat: now,
  };

  if (!isAnonToken) {
    try {
      const user = await getUserWithSessionBySessionId(sessionId);
      if (!user) {
        throw new Error('User not found for session ID: ' + sessionId);
      }
      claims.uid = user.id;
    } catch (err) {
      throw new Error('Failed to retrieve user for session ID: ' + sessionId);
    }
  }
  if (audience) {
    claims.aud = audience;
  }
  claims.jti = generateJti();

  return claims as TokenClaims;
}

export { issueToken, verifyToken, makeClaimsHelper };
