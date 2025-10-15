import { Request, Router } from "express";
import { DoResponse } from "@/utils/do-resnpose";
import { getUserWithSessionBySessionId } from "@/services/auth/user";
import { UserSchema, UserWithSession, UserWithSessionSchema, User } from "@/schemas/object/User";
import { updateUserById } from "@/services/auth/user";
import Logger from "@/logger";

const router = Router();
const logger = new Logger('routes', 'i');

/**
 * @swagger
 * /i:
 *   get:
 *     summary: Fetch the authenticated user's profile.
     description: Returns the session-bound user and whether a pending redirect exists.
     tags:
       - User
     security:
       - CookieAuth: []
     responses:
       "200":
         description: Authenticated user profile.
         content:
           application/json:
             schema:
               type: object
               properties:
                 id:
                   type: string
                 displayName:
                   type: string
                   nullable: true
                 hasPendingRedirect:
                   type: boolean
               required:
                 - id
                 - displayName
                 - hasPendingRedirect
       "401":
         description: Session cookie is missing or invalid.
         content:
           application/json:
             schema:
               type: object
               properties:
                 message:
                   type: string
               required:
                 - message
             example:
               message: Unauthorized
   put:
     summary: Update the authenticated user's profile.
     description: Allows the user to update editable fields such as `displayName`.
     tags:
       - User
     security:
       - CookieAuth: []
     requestBody:
       required: true
       content:
         application/json:
           schema:
             type: object
             properties:
               displayName:
                 type: string
                 nullable: true
             additionalProperties: false
     responses:
       "200":
         description: Updated user profile.
         content:
           application/json:
             schema:
               type: object
               properties:
                 id:
                   type: string
                 displayName:
                   type: string
                   nullable: true
               required:
                 - id
                 - displayName
       "400":
         description: Request body failed validation.
         content:
           application/json:
             schema:
               type: object
               properties:
                 message:
                   type: string
               required:
                 - message
             example:
               message: Invalid request body
       "401":
         description: Session cookie is missing or invalid.
         content:
           application/json:
             schema:
               type: object
               properties:
                 message:
                   type: string
               required:
                 - message
             example:
               message: Unauthorized
       "500":
         description: Failed to persist the user update.
 */
router.get('/', async (req, res) => {
  const userWithSession = await verifySessionAndGetUserHelper(req);
  if (!userWithSession) {
    return DoResponse.init(res).unauthorized().errorMessage('Unauthorized').send();
  }

  return DoResponse.init(res).ok().validatedJson(userWithSession, UserWithSessionSchema).send();
});

router.put('/', async (req, res) => {
  const userWithSession = await verifySessionAndGetUserHelper(req);
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
async function verifySessionAndGetUserHelper(req: Request): Promise<UserWithSession | null> {
  const cookies = req.cookies;
  const sessionId = cookies ? (cookies.sessionId as string | undefined) : undefined;
  if (!sessionId) {
    return null;
  }
  const userWithSession = await getUserWithSessionBySessionId(sessionId).catch(() => null);
  if (!userWithSession) {
    return null;
  }
  return userWithSession;
}

export default router;
