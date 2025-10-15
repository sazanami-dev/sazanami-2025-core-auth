import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAuthenticatedSession, isAnonymousSession } from "@/services/auth/session";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { verifyRegCodeAndResolveUser } from "@/services/auth/regCode";
import { PendingRedirect } from "@prisma/client";
import { createPendingRedirect, getPendingRedirect } from "@/services/auth/pending-redirect";

const router = Router();

/**
 * @swagger
 * /initialize:
 *   get:
 *     summary: Complete account initialization using a registration code.
     description: >
       Validates the provided `regCode`, upgrades the caller's session to an authenticated session,
       and redirects the browser to the account initialization page with a one-time token.
     tags:
       - Authentication
     parameters:
       - in: query
         name: regCode
         required: true
         schema:
           type: string
         description: Registration code issued to the user in advance.
     responses:
       "302":
         description: Redirect to the configured account initialization page with an access token.
         headers:
           Set-Cookie:
             schema:
               type: string
             description: Session identifier cookie upgraded to an authenticated session.
       "200":
         description: User was already authenticated; no redirect is performed.
         content:
           application/json:
             schema:
               type: object
               properties:
                 message:
                   type: string
               required:
                 - message
             example:
               message: OK
       "400":
         description: Missing or invalid registration code.
         content:
           application/json:
             schema:
               type: object
               properties:
                 message:
                   type: string
               required:
                 - message
             examples:
               missing:
                 summary: Missing regCode
                 value:
                   message: regCode query parameter is required
               invalid:
                 summary: Invalid regCode
                 value:
                   message: Invalid regCode
       "500":
         description: Failed to persist the new session or redirect data.
 */
router.get('/', async (req, res) => {
  // regCodeを受け取ってユーザー初期化処理を開始する

  const reqCode = req.query.regCode as string | undefined;
  const cookies = req.cookies;
  let sessionId: string | undefined;

  // regCodeからユーザーを特定
  if (!reqCode) {
    return DoResponse.init(res).badRequest().errorMessage('regCode query parameter is required').send();
  }
  const user = await verifyRegCodeAndResolveUser(reqCode).catch(() => null);
  if (!user) {
    return DoResponse.init(res).badRequest().errorMessage('Invalid regCode').send();
  }

  // セッション処理
  let pendingRedirect: PendingRedirect | null = null;

  if (cookies && cookies.sessionId) {
    if (await isAnonymousSession(cookies.sessionId)) {
      pendingRedirect = await getPendingRedirect(cookies.sessionId);
    } else {
      return DoResponse.init(res).ok().send();
    }
  }

  await createAuthenticatedSession(user.id).then(session => {
    sessionId = session.id;
  });

  if (pendingRedirect) {
    createPendingRedirect(sessionId!,
      pendingRedirect.redirectUrl === null ? undefined : pendingRedirect.redirectUrl,
      pendingRedirect.postbackUrl === null ? undefined : pendingRedirect.postbackUrl,
      pendingRedirect.state === null ? undefined : pendingRedirect.state);
  }

  res.cookie('sessionId', sessionId, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 2, // 2 days
  });

  // 初期設定用トークンを発行し、リダイレクトする
  const token = await issueToken(makeClaimsHelper(sessionId!));

  const url = new URL(EnvUtil.get(EnvKey.ACCOUNT_INITIALIZATION_PAGE));
  url.searchParams.append('token', token);

  return DoResponse.init(res).redirect(url.toString()).send();
});

export default router;
