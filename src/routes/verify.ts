import { Router } from "express";
import { verifyToken } from "@/services/auth/token";
import { DoResponse } from "@/utils/do-resnpose";
import { VerifyResponseSchema } from "@/schemas/request/verifySchema";

const router = Router();

router.post("/", async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: "Token is required" });
  }

  const verified = await verifyToken(token);
  if (verified) {
    return DoResponse.init(res).ok().validatedJson({ valid: true, payload: verified }, VerifyResponseSchema).send();
  } else {
    return DoResponse.init(res).ok().validatedJson({ valid: false }, VerifyResponseSchema).send();
  }
});

export default router;
