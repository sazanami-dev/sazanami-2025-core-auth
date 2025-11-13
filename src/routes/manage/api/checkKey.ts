import { Router } from "express";
import { sendJson } from "./helpers";

const router = Router();
router.get("/", (_req, res) => {
  return sendJson(res, { valid: true });
});

export default router;
