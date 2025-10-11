import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAnonymousSession, verifySessionIdAndResolveUser } from "@/services/auth/session";
import { createPendingRedirect } from "@/services/auth/pending-redirect";
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

  if (!redirectUrl) {
    return DoResponse.init(res).badRequest().errorMessage('redirectUrl query parameter is required').send();
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

  if (!user) { // ここにひっかかる場合が想像できないけど...
    // Save pending redirect
    await createPendingRedirect(sessionId!, redirectUrl, postbackUrl, state);
    return DoResponse.init(res).redirect(EnvUtil.get(EnvKey.REAUTHENTICATION_PAGE)).send();
  }

  const token = await issueToken(makeClaimsHelper(sessionId));

  if (postbackUrl) { // この場合, クライアントはredirectUrlに単に返し、トークンはバックエンドにPOSTする
    await fetch(postbackUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token,
        state: state ?? null,
      }),
    }).catch(err => {
      return DoResponse.init(res).badRequest().errorMessage('Failed to post to postbackUrl: ' + err.message).send();
    });

    return DoResponse.init(res).redirect(redirectUrl).send();
  }

  // Redirect
  const url = new URL(redirectUrl);
  url.searchParams.append('token', token);
  if (state) {
    url.searchParams.append('state', state);
  }
  return DoResponse.init(res).redirect(url.toString()).send();
});

export default router;
