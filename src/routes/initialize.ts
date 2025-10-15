import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAuthenticatedSession, isAnonymousSession } from "@/services/auth/session";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { verifyRegCodeAndResolveUser } from "@/services/auth/regCode";
import { PendingRedirect } from "@prisma/client";
import { createPendingRedirect, getPendingRedirect } from "@/services/auth/pending-redirect";

const router = Router();

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
