import { Router } from "express";
import { issueToken, makeClaimsHelper } from "@/services/auth/token";
import { DoResponse } from "@/utils/do-resnpose";
import { makeErrorPageUrlHelper } from "@/utils/make-error-page-url-helper";

const router = Router();

router.get("/", async (req, res) => {
  const sessionId = req.cookies['sessionId'];
  if (!sessionId) {
    const errorPageUrl = makeErrorPageUrlHelper(
      'SESSION_ID_MISSING',
      'セッションIDが見つかりません。',
      'クッキーにセッションIDが含まれていません'
    );
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }

  const token = issueToken(await makeClaimsHelper(sessionId));
  return DoResponse.init(res).json({ token }).send();
});

export default router;
