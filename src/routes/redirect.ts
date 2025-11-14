import { Router } from "express";
import { deletePendingRedirect, getPendingRedirect } from "@/services/auth/pending-redirect";
import { DoResponse } from "@/utils/do-resnpose";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { makeErrorPageUrlHelper } from "@/utils/make-error-page-url-helper";
import Logger from "@/logger";

const router = Router();
const logger = new Logger('routes', 'redirect');

router.get('/', async (req, res) => {
  const sessionId = req.cookies?.sessionId as string | undefined;
  if (!sessionId) {
    const errorPageUrl = makeErrorPageUrlHelper('SESSION_ID_MISSING', 'セッションIDが見つかりません。', 'sessionId cookie is required!');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  let pendingRedirect;

  try {
    pendingRedirect = await getPendingRedirect(sessionId);
  } catch (e) {
    logger.error(`Failed to fetch pending redirect: ${e}`);
    const errorPageUrl = makeErrorPageUrlHelper('PENDING_REDIRECT_FETCH_FAILED', 'リダイレクト情報の取得に失敗しました。', 'Failed to retrieve pending redirect.');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  if (!pendingRedirect) {
    const errorPageUrl = makeErrorPageUrlHelper('PENDING_REDIRECT_NOT_FOUND', '保留中のリダイレクトが見つかりません。', 'No pending redirect found for this session or it has expired.');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  const { redirectUrl, postbackUrl, state } = pendingRedirect;

  // このへんのロジックがauthenticate.tsと重複しているので共通化したい

  const cleanupPendingRedirect = async () => {
    try {
      await deletePendingRedirect(pendingRedirect!.id);
    } catch (err) {
      logger.error(`Failed to delete pending redirect ${pendingRedirect!.id}: ${err}`);
    }
  };

  // Validate redirectUrl and postbackUrl
  try {
    new URL(redirectUrl!);
    if (postbackUrl) new URL(postbackUrl!);
  } catch (e) {
    logger.error(`URL validation failed: ${e}`);
    await cleanupPendingRedirect();
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
      await cleanupPendingRedirect();
      const errorPageUrl = makeErrorPageUrlHelper('POSTBACK_FAILED', '連携先との接続に失敗しました。', 'Failed to postback to the specified URL.');
      return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
    }
  }

  try {
    // Redirect
    const url = new URL(redirectUrl!);
    if (!postbackUrl) {
      url.searchParams.append('token', token);
      if (state) {
        url.searchParams.append('state', state);
      }
    }

    await cleanupPendingRedirect();
    return DoResponse.init(res).redirect(url.toString()).send();
  } catch (e) {
    await cleanupPendingRedirect();
    logger.error(`Failed to redirect: ${e}`);
    const errorPageUrl = makeErrorPageUrlHelper('REDIRECT_FAILED', 'リダイレクトに失敗しました。', 'Failed to process redirect.');
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

});

export default router;
