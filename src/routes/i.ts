import { Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { getUserWithSessionBySessionId } from "@/services/auth/user";
import { UserWithSessionSchema } from "@/schemas/object/User";

const router = Router();

router.get('/', async (req, res) => {
  const cookies = req.cookies;
  const sessionId = cookies ? (cookies.sessionId as string | undefined) : undefined;

  if (!sessionId) {
    return DoResponse.init(res).unauthorized().errorMessage('No session').send();
  }

  const userWithSession = await getUserWithSessionBySessionId(sessionId).catch(() => null);

  if (!userWithSession) {
    return DoResponse.init(res).unauthorized().errorMessage('Invalid session').send();
  }

  return DoResponse.init(res).ok().validatedJson(userWithSession, UserWithSessionSchema).send();
});

router.put('/', async (req, res) => {
  // ユーザー情報を書き換える
});
