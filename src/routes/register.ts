import { generateUser } from "@/services/auth/user";
import { DoResponse } from "@/utils/do-resnpose";
import { Router } from "express";

const router = Router();

// GETだとブラウザで複数回踏めてしまうので
// (POSTでも故意にいたずらすることはできるが、ブラウザだけで叩けるよりはマシなので)
router.post('/', async (req, res) => {
  // Generate new user
  const newUser = await generateUser();
  return DoResponse.init(res).json({
    success: true,
    userId: newUser.id,
  });

  // TODO: エラーハンドリング
  // TODO: レートリミットを考える?
  // TODO: バリデーションを行う
});

export default router;
