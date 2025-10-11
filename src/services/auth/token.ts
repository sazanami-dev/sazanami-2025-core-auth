import { TokenClaims } from "@/schemas/tokenClaimsSchema";
import jwt from "jsonwebtoken";
import Logger from "@/logger";
import { getKey } from "@/key";
import { EnvUtil, EnvKey } from "@/utils/env-util";

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

function makeClaimsHelper(userId: string, expiresInSeconds?: number, audience?: string): TokenClaims {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + (expiresInSeconds ?? EnvUtil.get(EnvKey.TOKEN_DEFAULT_EXPIRATION));
  const iss = EnvUtil.get(EnvKey.TOKEN_DEFAULT_ISSUER);
  const claims: TokenClaims = {
    sub: userId,
    iss,
    exp,
    iat: now,
  };
  if (audience) {
    claims.aud = audience;
  }
  return claims;
}

export { issueToken, verifyToken };

