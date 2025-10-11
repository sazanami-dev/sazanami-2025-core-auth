import { Router } from "express";
import iRoute from "./i";
import authenticateRoute from "./authenticate";
import initializeRoute from "./initialize";

const router = Router();

router.use('/i', iRoute);
router.use('/authenticate', authenticateRoute);
router.use('/initialize', initializeRoute);

export default router;
