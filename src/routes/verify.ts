import { Router } from "express";
import { getKey } from "@/key";
import jwt from "jsonwebtoken";

const router = Router();

router.post("/", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const signKey = await getKey();

  const verified = jwt.verify(token, signKey.publicKey, { algorithms: [signKey.cryptoAlgorithm] });
  if (verified) {
    return res.status(200).json({ valid: true, payload: verified });
  } else {
    return res.status(200).json({ valid: false });
  }
});

export default router;
