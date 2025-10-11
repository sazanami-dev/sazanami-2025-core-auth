import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAnonymousSession, verifySessionIdAndResolveUser } from "@/services/auth/session";
import { createPendingRedirect, getPendingRedirect } from "@/services/auth/pending-redirect";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";

const router = Router();

router.get('/', async (req, res) => {
  // Get query parameters
  const redirectUrl = req.query.redirectUrl as string | undefined;
  const postbackUrl = req.query.postbackUrl as string | undefined;
  const state = req.query.state as string | undefined;
  const cookies = req.cookies;
  let sessionId: string | undefined;

  if (!(redirectUrl || postbackUrl)) {
    return DoResponse.init(res).badRequest().errorMessage('Either redirectUrl or postbackUrl query parameter is required').send();
  }

  if (!cookies || !cookies.sessionId) {
    await createAnonymousSession().then(session => {
      sessionId = session.id;
    }).then(() => {
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 2, // 2 days
      });
    });

    // Save pending redirect
    await createPendingRedirect(sessionId!, redirectUrl, postbackUrl, state);
    
    const token = await issueToken(makeClaimsHelper(sessionId!)); // TODO:期限調整するかAudを指定するべきかも(クエリに載せるので)

    const url = new URL(EnvUtil.get(EnvKey.ACCOUNT_INITIALIZATION_PAGE));
    url.searchParams.append('token', token);

    // Redirect to login page
    return DoResponse.init(res).redirect(url.toString()).send();
  }

  // TODO: 実装する
  // セッションIDがある場合はユーザー情報を取得して認証状態を確認
  // →認証されていればそのままリダイレクト
  // →認証されていなければQRコードを再度読み取って認証するよう促す

});

export default router;
