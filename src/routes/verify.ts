import { Router } from "express";
import { verifyToken } from "@/services/auth/token";
import { DoResponse } from "@/utils/do-resnpose";
import { VerifyResponseSchema, VerifyRequestSchema } from "@/schemas/request/verifySchema";

const router = Router();

router.post("/", async (req, res) => {
  let token: string;
  try {
    const parsedBody = VerifyRequestSchema.parse(req.body);
    token = parsedBody.token;
  } catch (e) {
    return DoResponse.init(res).badRequest().errorMessage('Invalid request body').send();
  }

  const verified = await verifyToken(token);
  if (verified) {
    return DoResponse.init(res).ok().validatedJson({ valid: true, payload: verified }, VerifyResponseSchema).send();
  } else {
    return DoResponse.init(res).ok().validatedJson({ valid: false }, VerifyResponseSchema).send();
  }
});

export default router;
