import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAuthenticatedSession, isAnonymousSession } from "@/services/auth/session";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { verifyRegCodeAndResolveUser } from "@/services/auth/regCode";
import { PendingRedirect, User } from "@prisma/client";
import { createPendingRedirect, getPendingRedirect } from "@/services/auth/pending-redirect";
import { makeErrorPageUrlHelper } from "@/utils/make-error-page-url-helper";
import Logger from "@/logger";

const router = Router();
const logger = new Logger('route', 'initialize');

const SESSION_COOKIE_MAX_AGE = EnvUtil.get(EnvKey.SESSION_COOKIE_EXPIRATION);

router.get('/', async (req, res) => {
  const regCode = req.query.regCode as string | undefined;
  let user: User | null = null;
  let sessionId: string | undefined;
  let pendingRedirect: PendingRedirect | null = null;

  if (!regCode) {
    const errorPageUrl = makeErrorPageUrlHelper('REQUIRED_PARAMETER_MISSING', '必須パラメーターが欠落しています。', 'regCode query parameter is required!');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  try {
    user = await verifyRegCodeAndResolveUser(regCode);
    if (!user) {
      throw new Error(); // 直後で拾うので
    }
  } catch (e) {
    logger.error(`Failed to verify regCode: ${e}`);
    const errorPageUrl = makeErrorPageUrlHelper('INVALID_REGCODE', '無効な登録コードです。', 'regCode is invalid or expired.');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  if (req.cookies && req.cookies.sessionId) {
    pendingRedirect = await getPendingRedirect(req.cookies.sessionId);
    if (!await isAnonymousSession(req.cookies.sessionId)) {
      sessionId = req.cookies.sessionId;
    } else {
      sessionId = await createAuthenticatedSession(user.id).then(session => session.id);
    }
  } else {
    sessionId = await createAuthenticatedSession(user.id).then(session => session.id);
  }

  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: SESSION_COOKIE_MAX_AGE,
  });

  if (user.isInitialized) {
    if (pendingRedirect) {
      // Pending redirectがある場合はそれを処理させる
      return DoResponse.init(res).redirect('/redirect').send();
    } else {
      // そうでなければポータルに飛ばす
      return DoResponse.init(res).redirect(EnvUtil.get(EnvKey.PORTAL_PAGE)).send();
    }
  } else {
    if (pendingRedirect) {
      await createPendingRedirect(sessionId!, pendingRedirect.redirectUrl ?? undefined, pendingRedirect.postbackUrl ?? undefined, pendingRedirect.state ?? undefined);
    }
  }

  const token = await issueToken(await makeClaimsHelper(sessionId!));
  const url = new URL(EnvUtil.get(EnvKey.ACCOUNT_INITIALIZATION_PAGE));
  url.searchParams.append('token', token);

  logger.info(`User ${user.id} initialized. Redirecting to initialization page.`);
  return DoResponse.init(res).redirect(url.toString()).send();
});

export default router;
