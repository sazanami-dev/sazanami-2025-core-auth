import { Router } from "express";
import { getPendingRedirect } from "@/services/auth/pending-redirect";
import { DoResponse } from "@/utils/do-resnpose";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { makeErrorPageUrlHelper } from "@/utils/make-error-page-url-helper";

const router = Router();

router.get('/', async (req, res) => {
  const sessionId = req.cookies?.sessionId as string | undefined;
  if (!sessionId) {
    const errorPageUrl = makeErrorPageUrlHelper('SESSION_ID_MISSING', 'セッションIDが見つかりません。', 'sessionId cookie is required!');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  let pendingRedirect;

  try {
    pendingRedirect = await getPendingRedirect(sessionId);
    if (!pendingRedirect) {
      const errorPageUrl = makeErrorPageUrlHelper('PENDING_REDIRECT_NOT_FOUND', '保留中のリダイレクトが見つかりません。', 'No pending redirect found for this session or it has expired.');
      return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
    }
  } catch (e) {
    return;
  }

  const { redirectUrl, postbackUrl, state } = pendingRedirect;

  // Validate redirectUrl and postbackUrl
  try {
    new URL(redirectUrl!);
    if (postbackUrl) new URL(postbackUrl!);
  } catch (e) {
    const errorPageUrl = makeErrorPageUrlHelper('INVALID_URL', '無効なURLです。', 'redirectUrl or postbackUrl is not a valid URL.');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  const token = await issueToken(await makeClaimsHelper(sessionId));

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
