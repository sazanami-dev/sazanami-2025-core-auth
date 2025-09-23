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

export { verifyRegCodeAndResolveUser };
