import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { verifyRegCodeAndResolveUser } from "@/services/auth/regCode";
import { EnvKey, EnvUtil } from "@/utils/env-util";

const router = Router();

router.get('/', async (req, res) => {
  // Get query parameters
  const redirectUrl = req.query.redirectUrl as string | undefined;
  const state = req.query.state as string | undefined;
  const regCode = req.query.regCode as string | undefined;

  if (!redirectUrl) return DoResponse.init(res).badRequest().errorMessage('redirectUrl query parameter is required').send();

  if (regCode) {
    // When initiating registration, redirect to registration page
    const user = await verifyRegCodeAndResolveUser(regCode);
    if (!user) {
      return DoResponse.init(res).badRequest().errorMessage('Invalid registration code').send();
    }

    const initPage = EnvUtil.get(EnvKey.ACCOUNT_INITIALIZATION_PAGE);

    const url = new URL(initPage);
    if (state) url.searchParams.append('state', state);
    url.searchParams.append('redirectUrl', redirectUrl);

    return DoResponse.init(res).ok().json({ redirectTo: url.toString() }).send();
  }

  // TODO: login

});

export default router;
