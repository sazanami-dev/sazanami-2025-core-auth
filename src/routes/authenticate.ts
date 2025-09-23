import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { createAnonymousSession, verifySessionIdAndResolveUser } from "@/services/auth/session";

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
    createAnonymousSession().then(session => {
      sessionId = session.id;
    }).then(() => {
      res.cookie('sessionId', sessionId, {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 2, // 2 days
      });
    });

    // redirect
  }

  // todo

});

export default router;
