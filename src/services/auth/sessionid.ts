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

export { verifyAndResolveSessionId };
