import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAuthenticatedSession, isAnonymousSession } from "@/services/auth/session";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { verifyRegCodeAndResolveUser } from "@/services/auth/regCode";
import { PendingRedirect } from "@prisma/client";
import { createPendingRedirect, getPendingRedirect } from "@/services/auth/pending-redirect";
import Logger from "@/logger";

const router = Router();
const logger = new Logger('route', 'initialize');

const SESSION_COOKIE_MAX_AGE = 1000 * 60 * 60 * 24 * 2; // 2 days

router.get('/', async (req, res) => {
  const reqCode = req.query.regCode as string | undefined;
  if (!reqCode) {
    return DoResponse.init(res).badRequest().errorMessage('regCode query parameter is required').send();
  }

  const user = await verifyRegCodeAndResolveUser(reqCode).catch(() => null);
  if (!user) {
    return DoResponse.init(res).badRequest().errorMessage('Invalid regCode').send();
  }

  const { sessionId: oldSessionId } = req.cookies;
  let pendingRedirect: PendingRedirect | null = null;

  if (oldSessionId) {
    const isAnonymous = await isAnonymousSession(oldSessionId);

    if (isAnonymous) {
      pendingRedirect = await getPendingRedirect(oldSessionId);
    } else if (user.isInitialized) {
      logger.info(`User ${user.id} attempted to re-initialize but is already initialized. Redirecting to portal.`);
      return DoResponse.init(res).redirect(EnvUtil.get(EnvKey.PORTAL_PAGE)).send();
    }
  }

  const newSession = await createAuthenticatedSession(user.id);
  const newSessionId = newSession.id;

  if (pendingRedirect) {
    await createPendingRedirect(
      newSessionId,
      pendingRedirect.redirectUrl ?? undefined,
      pendingRedirect.postbackUrl ?? undefined,
      pendingRedirect.state ?? undefined
    );
  }

  res.cookie('sessionId', newSessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  const token = await issueToken(await makeClaimsHelper(newSessionId));
  const url = new URL(EnvUtil.get(EnvKey.ACCOUNT_INITIALIZATION_PAGE));
  url.searchParams.append('token', token);

  logger.info(`Redirecting to account initialization page for user ${user.id}`);
  return DoResponse.init(res).redirect(url.toString()).send();
});

export default router;
