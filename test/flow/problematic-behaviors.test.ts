import request from "supertest";
import { createApp } from "@/app";
import { beforeEach, afterEach, describe, expect, test, vitest } from "vitest";
import prisma from "@/prisma";
import { fixtures } from "test/fixtures";

describe('Potentially problematic behaviors', () => {
  beforeEach(async () => {
    vitest.mock('@prisma/client');
  });

  afterEach(async () => {
    await prisma.pendingRedirect.deleteMany();
    await prisma.session.deleteMany();
    await prisma.registrationCode.deleteMany();
    await prisma.user.deleteMany();

    vitest.clearAllMocks();
  });

  describe('Registration code reuse', () => {
    beforeEach(async () => {
      await prisma.user.create({
        data: fixtures.users.user1,
      });
      await prisma.registrationCode.create({
        data: fixtures.registrationCodes.regCode1,
      });
    });

    test('allows the same regCode to initialize unlimited times (BUG)', async () => {
      const app = await createApp();

      const first = await request(app)
        .get('/initialize')
        .query({ regCode: fixtures.registrationCodes.regCode1.code });

      expect(first.status).toBe(302);

      const regCodeAfterFirstUse = await prisma.registrationCode.findUnique({
        where: { code: fixtures.registrationCodes.regCode1.code },
      });
      expect(regCodeAfterFirstUse).not.toBeNull();

      const second = await request(app)
        .get('/initialize')
        .query({ regCode: fixtures.registrationCodes.regCode1.code });

      expect(second.status).toBe(302);

      const sessionsForUser = await prisma.session.findMany({
        where: { userId: fixtures.users.user1.id },
      });
      expect(sessionsForUser.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Pending redirect replay', () => {
    const initializedUser = {
      ...fixtures.users.user1,
      isInitialized: true,
    };
    beforeEach(async () => {
      await prisma.user.create({
        data: initializedUser,
      });
      await prisma.session.create({
        data: fixtures.sessions.session1,
      });
      await prisma.pendingRedirect.create({
        data: {
          id: 'pending-replay',
          sessionId: fixtures.sessions.session1.id,
          redirectUrl: 'https://example.com/replay',
          state: 'state123',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        }
      });
    });

    test('allows the same pending redirect to be replayed multiple times (BUG)', async () => {
      const app = await createApp();

      const first = await request(app)
        .get('/redirect')
        .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);

      expect(first.status).toBe(302);

      const pendingAfterFirst = await prisma.pendingRedirect.findUnique({
        where: { id: 'pending-replay' },
      });
      expect(pendingAfterFirst).not.toBeNull();

      const second = await request(app)
        .get('/redirect')
        .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);

      expect(second.status).toBe(302);
    });
  });
});
