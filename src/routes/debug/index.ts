import { Router } from "express";
import issueRegcodeRouter from "./issue-regcode.js";
import issueTokenRouter from "./issue-token.js";

const router = Router();

router.use("/issue-regcode", issueRegcodeRouter);
router.use("/issue-token", issueTokenRouter);

export default router;
