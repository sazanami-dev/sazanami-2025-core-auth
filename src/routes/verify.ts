import { Router } from "express";
import { verifyToken } from "@/services/auth/token";

const router = Router();

router.post("/", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const verified = await verifyToken(token);
  if (verified) {
    return res.status(200).json({ valid: true, payload: verified });
  } else {
    return res.status(200).json({ valid: false });
  }
});

export default router;
