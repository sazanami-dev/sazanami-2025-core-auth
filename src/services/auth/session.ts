import prisma from '@/prisma';

async function verifySessionIdAndResolveUser(sessionId: string) {
  const user = await prisma.session.findUnique({
    where: {
      id: sessionId
    },
    include: { user: true },
  });

  if (!user) {
    return null;
  }
  return user.user;
}

/**
* 新しい匿名セッションを作成する
*/
async function createAnonymousSession() {
  const session = await prisma.session.create({});

  return session;
}

export { verifySessionIdAndResolveUser, createAnonymousSession };
