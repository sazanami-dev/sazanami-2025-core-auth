import { Router } from "express";
import verifyManageKeyMiddleware from "@/middlewares/verify-manage-key";

const router = Router();
router.get("/", verifyManageKeyMiddleware, (_req, res) => {
  res.json({ valid: true });
});
