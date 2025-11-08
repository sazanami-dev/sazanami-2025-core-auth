import { Request, Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { getUserWithSessionBySessionId } from "@/services/auth/user";
import { UserSchema, UserWithSession, UserWithSessionSchema, User } from "@/schemas/object/User";
import { updateUserById } from "@/services/auth/user";
import Logger from "@/logger";
import { verifyToken } from "@/services/auth/token";

const router = Router();
const logger = new Logger('routes', 'i');

router.get('/', async (req, res) => {
  const userWithSession = await verifyAndGetUserHelper(req);
  if (!userWithSession) {
    return DoResponse.init(res).unauthorized().errorMessage('Unauthorized').send();
  }

  return DoResponse.init(res).ok().validatedJson(userWithSession, UserWithSessionSchema).send();
});

router.put('/', async (req, res) => {
  const userWithSession = await verifyAndGetUserHelper(req);
  if (!userWithSession) {
    return DoResponse.init(res).unauthorized().errorMessage('Unauthorized').send();
  }

  let updateData: Partial<User>;

  try {
    updateData = UserSchema.partial().parse(req.body);
  } catch (e) {
    logger.error('Failed to update user', e as string);
    return DoResponse.init(res).badRequest().errorMessage('Invalid request body').send();
  }

  const updatedUser = await updateUserById(userWithSession!.id, updateData).catch(err => {
    logger.error('Failed to update user', err);
    return DoResponse.init(res).internalServerError().errorMessage('Failed to update user').send();
  });

  return DoResponse.init(res).ok().validatedJson(updatedUser, UserSchema).send();
});

// Helper function to verify session
async function verifyAndGetUserHelper(req: Request): Promise<UserWithSession | null> {
  let sessionId: string | undefined = undefined;

  // Check Authorization header first
  if (req.headers.authorization) {
    const authHeader = req.headers.authorization;
    const token = authHeader.split(' ')[1];
    if (token) {
      const tokenClaims = await verifyToken(token);
      if (tokenClaims) {
        sessionId = tokenClaims.sub;
      } else {
        throw new Error('Invalid token in Authorization header');
      }
    }
  }

  if (!sessionId) {
    const cookies = req.cookies;
    sessionId = cookies ? (cookies.sessionId as string | undefined) : undefined;
  }

  if (!sessionId) throw new Error('No session ID found');

  const userWithSession = await getUserWithSessionBySessionId(sessionId).catch(() => null);

  if (!userWithSession) throw new Error('User not found for session ID: ' + sessionId);

  return userWithSession;
}

export default router;
