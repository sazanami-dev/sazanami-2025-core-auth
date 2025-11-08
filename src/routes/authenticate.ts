import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAnonymousSession, verifySessionIdAndResolveUser } from "@/services/auth/session";
import { createPendingRedirect } from "@/services/auth/pending-redirect";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { makeErrorPageUrlHelper } from "@/utils/make-error-page-url-helper";

const router = Router();

router.get('/', async (req, res) => {
  // Get query parameters
  const redirectUrl = req.query.redirectUrl as string | undefined;
  const postbackUrl = req.query.postbackUrl as string | undefined;
  const state = req.query.state as string | undefined;
  const cookies = req.cookies;
  let sessionId: string | undefined;

  if (!redirectUrl) {
    const errorPageUrl = makeErrorPageUrlHelper('REQUIRED_PARAMETER_MISSING', '必須パラメーターが欠落しています。', 'redirectUrl query parameter is required!');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
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

    return DoResponse.init(res).redirect(EnvUtil.get(EnvKey.REAUTHENTICATION_PAGE)).send();
  }

  sessionId = cookies.sessionId as string;

  const user = await verifySessionIdAndResolveUser(sessionId).catch(() => null);

  if (!user) { // 匿名セッションのままここに流れてきた場合?
    // Save pending redirect
    await createPendingRedirect(sessionId!, redirectUrl, postbackUrl, state);
    return DoResponse.init(res).redirect(EnvUtil.get(EnvKey.REAUTHENTICATION_PAGE)).send();
  }

  const token = await issueToken(await makeClaimsHelper(sessionId));

  // Validate redirectUrl and postbackUrl
  try {
    new URL(redirectUrl!);
    if (postbackUrl) new URL(postbackUrl!);
  } catch (e) {
    const errorPageUrl = makeErrorPageUrlHelper('INVALID_URL', '無効なURLです。', 'redirectUrl or postbackUrl is not a valid URL.');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  // Postback
  if (postbackUrl) {
    try {
      await fetch(postbackUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          state: state ?? null,
        }),
      });
    } catch (e) {
      const errorPageUrl = makeErrorPageUrlHelper('POSTBACK_FAILED', '連携先との接続に失敗しました。', 'Failed to postback to the specified URL.');
      return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
    }
  }

  // Redirect
  const url = new URL(redirectUrl!);
  if (!postbackUrl) {
    url.searchParams.append('token', token);
    if (state) {
      url.searchParams.append('state', state);
    }
  }
  return DoResponse.init(res).redirect(url.toString()).send();
});

export default router;
