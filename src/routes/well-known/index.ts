import { Router } from "express";
import jwksRouter from "./jwks-json";

const router = Router();

router.use('/jwks.json', jwksRouter);

export default router;
