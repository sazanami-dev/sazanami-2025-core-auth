import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAnonymousSession, verifySessionIdAndResolveUser } from "@/services/auth/session";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { EnvKey, EnvUtil } from "@/utils/env-util";

const router = Router();

router.get('/', async (req, res) => {
  // regCodeを受け取ってユーザー初期化処理を開始する

  const reqCode = req.query.regCode as string | undefined;
  const cookies = req.cookies;
  let sessionId: string | undefined;

  if (!reqCode) {
    return DoResponse.init(res).badRequest().errorMessage('regCode query parameter is required').send();
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
  } else sessionId = cookies.sessionId as string;

  // 初期設定用トークンを発行し、リダイレクトする
  const token = await issueToken(makeClaimsHelper(sessionId!));

  const url = new URL(EnvUtil.get(EnvKey.ACCOUNT_INITIALIZATION_PAGE));
  url.searchParams.append('token', token);

  return DoResponse.init(res).redirect(url.toString()).send();
});

