import prisma from '@/prisma';

async function verifyRegCodeAndResolveUser(regCode: string) {
  const user = await prisma.registrationCode.findUnique({
    where: {
      code: regCode
    },
    include: { user: true },
  });

  if (!user) {
    return null;
  }
  return user.user;
}

async function issueRegCodeForUser(userId: string, regCode?: string) {
  // If regCode is provided, use it; otherwise, generate a new one (8-character alphanumeric)
  const code = regCode || Math.random().toString(36).substring(2, 10).toUpperCase();
  try {
    await prisma.registrationCode.create({
      data: {
        code,
        userId,
      },
    });
  } catch (e) {
    throw new Error('Failed to issue registration code.', { cause: e });
  }
  return code;
}
export { verifyRegCodeAndResolveUser, issueRegCodeForUser };
