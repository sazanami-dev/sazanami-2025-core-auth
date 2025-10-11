import prisma from "@/prisma";
import { User, UserWithSession } from "@/schemas/object/User";

async function getUserById(userId: string): Promise<User | null> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    }
  });
  return user;
}

async function getUserWithSessionBySessionId(sessionId: string): Promise<UserWithSession | null> {
  const session = await prisma.session.findUnique({
    where: {
      id: sessionId
    },
    include: { user: true },
  });
  if (!session || !session.user) {
    return null;
  }

  const hasPendingRedirect = await prisma.pendingRedirect.findFirst({
    where: {
      sessionId: session.id,
    },
  }).then(pr => !!pr);

  return {
    ...session.user,
    hasPendingRedirect,
  };
}

export { getUserById, getUserWithSessionBySessionId };
