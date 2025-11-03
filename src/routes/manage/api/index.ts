import { Router } from "express";
import checkKeyRouter from "./checkKey.js";

const router = Router();

router.use("/checkKey", checkKeyRouter);

export default router;
