import { Request, Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { getUserWithSessionBySessionId } from "@/services/auth/user";
import { UserSchema, UserWithSession, UserWithSessionSchema, User } from "@/schemas/object/User";
import { updateUserById } from "@/services/auth/user";
import Logger from "@/logger";

const router = Router();
const logger = new Logger('routes', 'i');

router.get('/', async (req, res) => {
  const userWithSession = await verifySessionAndGetUserHelper(req).catch(err => {
    return DoResponse.init(res).unauthorized().errorMessage(err.message).send();
  });
  return DoResponse.init(res).ok().validatedJson(userWithSession, UserWithSessionSchema).send();
});

router.put('/', async (req, res) => {
  const userWithSession = await verifySessionAndGetUserHelper(req).catch(err => {
    return DoResponse.init(res).unauthorized().errorMessage(err.message).send();
  });

  let updateData: Partial<User>;
  try {
    updateData = UserSchema.parse(req.body);
  } catch (e) {
    return DoResponse.init(res).badRequest().errorMessage('Invalid request body').send();
  }
  const updatedUser = await updateUserById(userWithSession!.id, updateData).catch(err => {
    logger.error('Failed to update user', err);
    return DoResponse.init(res).internalServerError().errorMessage('Failed to update user').send();
  });

  return DoResponse.init(res).ok().validatedJson(updatedUser, UserSchema).send();
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
