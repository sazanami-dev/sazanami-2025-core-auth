import { Router } from "express";
import { issueRegCodeForUser } from "@/services/auth/regCode";
import { DoResponse } from "@/utils/do-resnpose";
import { makeErrorPageUrlHelper } from "@/utils/make-error-page-url-helper";

const router = Router();

router.get("/", (req, res) => {

  const userId = req.query.userId as string | undefined;
  if (!userId) {
    const errorPageUrl = makeErrorPageUrlHelper(
      'REQUIRED_PARAMETER_MISSING',
      '必須パラメーターが欠落しています。',
      'userId query parameter is required!'
    );
    return DoResponse.init(res).redirect(errorPageUrl.toString()).send();
  }
  issueRegCodeForUser(userId)
    .then((regCode) => {
      res.json({ regCode });
    })
    .catch((err) => {
      res.status(500).json({ error: "Failed to issue regCode.", details: err.message });
    });
});

export default router;
