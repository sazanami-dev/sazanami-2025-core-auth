import prisma from '@/prisma';

async function getPendingRedirect(sessionId: string) {
  const pendingRedirect = await prisma.pendingRedirect.findFirst({
    where: { sessionId },
  });

  return pendingRedirect;
}

async function createPendingRedirect(sessionId: string, redirectUrl?: string, postbackUrl?: string, state?: string, expiresAt?: Date) {
  if (!expiresAt) {
    expiresAt = new Date(Date.now() + 10 * 60 * 1000); // Default to 10 minutes from now
  }
  const pendingRedirect = await prisma.pendingRedirect.create({
    data: {
      sessionId,
      redirectUrl,
      postbackUrl,
      state,
      expiresAt
    },
  });
  return pendingRedirect;
}

export { getPendingRedirect, createPendingRedirect };
