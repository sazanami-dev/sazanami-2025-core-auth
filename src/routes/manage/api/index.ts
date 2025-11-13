import { Router } from "express";
import verifyManageKeyMiddleware from "@/middlewares/verify-manage-key";
import checkKeyRouter from "./checkKey";
import eventRouter from "./event";
import userRouter from "./user";
import regCodeRouter from "./regCode";
import sessionRouter from "./session";
import pendingRedirectRouter from "./pending-redirect";
import schemaRouter from "./schema";

const router = Router();

router.use(verifyManageKeyMiddleware);
router.use("/checkKey", checkKeyRouter);
router.use("/event", eventRouter);
router.use("/user", userRouter);
router.use("/regCode", regCodeRouter);
router.use("/session", sessionRouter);
router.use("/pending-redirect", pendingRedirectRouter);
router.use("/schema", schemaRouter);

export default router;
