import { Router } from "express";
import iRoute from "./i";
import authenticateRoute from "./authenticate";
import initializeRoute from "./initialize";
import wellKnownRoute from "./well-known";

const router = Router();

router.use('/i', iRoute);
router.use('/authenticate', authenticateRoute);
router.use('/initialize', initializeRoute);
router.use('/.well-known', wellKnownRoute);


export default router;
