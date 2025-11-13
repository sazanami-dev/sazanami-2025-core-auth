import { UserWithSession } from "@/schemas/object/User";
import { DoResponse } from "@/utils/do-resnpose";
import { verifyToken } from "@/services/auth/token";
import { getUserWithSessionBySessionId } from "@/services/auth/user";
import { Router, Request } from "express";

const router = Router();

router.get('/', async (req, res) => {
  const userWithSession = await verifyAndGetUserHelper(req).catch((e) => {
    return DoResponse.init(res).unauthorized().errorMessage('Unauthorized').send();
  });
  return DoResponse.init(res).ok().send();
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

