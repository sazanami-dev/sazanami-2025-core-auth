import { Router } from "express";
import iRoute from "./i";
import authenticateRoute from "./authenticate";
import initializeRoute from "./initialize";
import wellKnownRoute from "./well-known";
import verifyRoute from "./verify";

const router = Router();

router.use('/i', iRoute);
router.use('/authenticate', authenticateRoute);
router.use('/initialize', initializeRoute);
router.use('/.well-known', wellKnownRoute);
router.use('/verify', verifyRoute);

export default router;
