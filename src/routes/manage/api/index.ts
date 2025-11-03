import { Router } from "express";
import checkKeyRouter from "./checkKey";
import eventRouter from "./event";

const router = Router();

router.use("/checkKey", checkKeyRouter);
router.use("/event", eventRouter);

export default router;
