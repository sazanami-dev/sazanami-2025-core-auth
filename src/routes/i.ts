import { Request, Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { getUserWithSessionBySessionId } from "@/services/auth/user";
import { UserWithSession, UserWithSessionSchema } from "@/schemas/object/User";
import { updateUserById } from "@/services/auth/user";

const router = Router();

router.get('/', async (req, res) => {
  const userWithSession = await verifySessionAndGetUserHelper(req).catch(err => {
    return DoResponse.init(res).unauthorized().errorMessage(err.message).send();
  });
  return DoResponse.init(res).ok().validatedJson(userWithSession, UserWithSessionSchema).send();
});

router.put('/', async (req, res) => {
});


// Helper function to verify session
async function verifySessionAndGetUserHelper(req: Request): Promise<UserWithSession> {
  const cookies = req.cookies;
  const sessionId = cookies ? (cookies.sessionId as string | undefined) : undefined;
  if (!sessionId) {
    throw new Error('No session');
  }
  const userWithSession = await getUserWithSessionBySessionId(sessionId).catch(() => null);
  if (!userWithSession) {
    throw new Error('Invalid session');
  }
  return userWithSession;
}

export default router;
