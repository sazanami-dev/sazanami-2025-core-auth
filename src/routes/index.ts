import { Router } from "express";
import { EnvKey, EnvUtil } from "@/utils/env-util";
import iRoute from "./i";
import authenticateRoute from "./authenticate";
import initializeRoute from "./initialize";
import wellKnownRoute from "./well-known";
import verifyRoute from "./verify";
import debugRoute from "./debug";
import manageRoute from "./manage/api/index";
import Logger from "@/logger";

const router = Router();
const logger = new Logger("route", "index");

router.use('/i', iRoute);
router.use('/authenticate', authenticateRoute);
router.use('/initialize', initializeRoute);
router.use('/.well-known', wellKnownRoute);
router.use('/verify', verifyRoute);
router.use('/manage', manageRoute);

if (EnvUtil.get(EnvKey.NODE_ENV) !== 'production') {
  router.use('/debug', debugRoute);
  logger.warn("Debug routes are enabled.");
}

export default router;
