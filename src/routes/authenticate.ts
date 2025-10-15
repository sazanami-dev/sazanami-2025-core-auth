import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAnonymousSession, verifySessionIdAndResolveUser } from "@/services/auth/session";
import { createPendingRedirect } from "@/services/auth/pending-redirect";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";

const router = Router();

/**
 * @swagger
 * /authenticate:
 *   get:
 *     summary: Initiate authentication and deliver the issued token.
     description: >
       Creates or reuses the caller's session, stores the redirect targets, and redirects the browser either
       to the configured re-authentication page or back to the provided `redirectUrl`. When `postbackUrl`
       is supplied, the issued token is sent to that endpoint via JSON POST before the final redirect.
     tags:
       - Authentication
     parameters:
       - in: query
         name: redirectUrl
         required: true
         schema:
           type: string
           format: uri
         description: Absolute URL that receives the user after authentication. If `postbackUrl` is omitted the issued token and optional state are appended as query parameters.
       - in: query
         name: postbackUrl
         required: false
         schema:
           type: string
           format: uri
         description: Optional HTTPS endpoint that receives a JSON POST containing the token before the browser redirect.
       - in: query
         name: state
         required: false
         schema:
           type: string
         description: Opaque value that is echoed both in the postback payload and as a redirect query parameter.
     responses:
       "302":
         description: Redirect to either the re-authentication entry page or the requested redirect URL.
         headers:
           Set-Cookie:
             schema:
               type: string
             description: Session identifier cookie issued when a new anonymous session is created.
       "400":
         description: The request is invalid, or the postback failed.
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
               missingRedirect:
                 summary: Missing redirect URL
                 value:
                   message: redirectUrl query parameter is required
               invalidUrl:
                 summary: Invalid redirect URL
                 value:
                   message: Invalid redirectUrl
               postbackFailed:
                 summary: Postback failed
                 value:
                   message: Failed to post to postbackUrl
 */
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

  if (!user) { // 匿名セッションのままここに流れてきた場合?
    // Save pending redirect
    await createPendingRedirect(sessionId!, redirectUrl, postbackUrl, state);
    return DoResponse.init(res).redirect(EnvUtil.get(EnvKey.REAUTHENTICATION_PAGE)).send();
  }

  const token = await issueToken(makeClaimsHelper(sessionId));

  // Validate redirectUrl and postbackUrl
  try {
    new URL(redirectUrl);
    if (postbackUrl) new URL(postbackUrl);
  } catch (e) {
    return DoResponse.init(res).badRequest().errorMessage('Invalid redirectUrl').send();
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
      return DoResponse.init(res).badRequest().errorMessage('Failed to post to postbackUrl').send();
    }
  }

  // Redirect
  const url = new URL(redirectUrl);
  if (!postbackUrl) {
    url.searchParams.append('token', token);
    if (state) {
      url.searchParams.append('state', state);
    }
  }
  return DoResponse.init(res).redirect(url.toString()).send();
});

export default router;
