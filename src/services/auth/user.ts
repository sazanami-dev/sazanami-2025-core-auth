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

  const now = new Date();
  const hasPendingRedirect = await prisma.pendingRedirect.findFirst({
    where: {
      sessionId: session.id,
      expiresAt: { gt: now }
    },
    orderBy: { createdAt: 'desc' },
  }).then(pr => !!pr);

  return {
    ...session.user,
    hasPendingRedirect,
  };
}

async function updateUserById(userId: string, data: Partial<User>): Promise<User> {
  console.log('Updating user:', userId, data);
  const updatedUser = await prisma.user.update({
    where: {
      id: userId
    },
    data: {
      ...data,
      id: userId, // idは更新しないが、Prismaの仕様上必須なので入れておく
    }
  });
  return updatedUser;
}

export { getUserById, getUserWithSessionBySessionId, updateUserById };
