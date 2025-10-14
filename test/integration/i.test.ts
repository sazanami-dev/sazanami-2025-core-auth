import request from 'supertest';
import { createApp } from '@/app';
import { fixtures } from 'test/fixtures';
import { expect, test, beforeEach, vitest, describe } from 'vitest';
import prisma from '@/prisma';

const I_PATH = '/i';

beforeEach(async () => {
  vitest.mock('@prisma/client');
  await prisma.user.create({
    data: fixtures.users.user1
  });

  await prisma.session.create({
    data: fixtures.sessions.session1
  });
});

// 認証済みのセッションを持っている場合
describe('when having an authenticated session', () => {
  describe('when fetching user info', () => {
    let app, response: request.Response;
    beforeEach(async () => {
      app = await createApp();
      response = await request(app)
        .get(I_PATH)
        .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);
    });
    // ユーザーの正しい基本情報が返る
    test('should return correct basic user info', () => {
      expect(response.status).toBe(200);
      const body = response.body;
      expect(body).toHaveProperty('id', fixtures.users.user1.id);
      expect(body).toHaveProperty('displayName', fixtures.users.user1.displayName);
    });
    // pendingRedirectが正しく処理される
    describe('should handle pendingRedirect correctly', () => {
      test('when there is a pendingRedirect within the valid period, should return true', async () => {
        // 有効期限内のpendingRedirectを作成
        await prisma.pendingRedirect.create({
          data: {
            id: 'pendingRedirect1',
            sessionId: fixtures.sessions.session1.id,
            redirectUrl: 'https://example.com/redirect',
            createdAt: new Date(),
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5分後に有効期限
          }
        });

        const app = await createApp();
        const response = await request(app)
          .get(I_PATH)
          .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);

        // Check response
        expect(response.status).toBe(200);
        const body = response.body;
        expect(body).toHaveProperty('hasPendingRedirect', true);
      });
      // 有効期限切れのpendingRedirectがあってもtrueを返さない
      test('when there is an expired pendingRedirect, should not return true', async () => {
        // 有効期限切れのpendingRedirectを作成
        await prisma.pendingRedirect.create({
          data: {
            id: 'pendingRedirect2',
            sessionId: fixtures.sessions.session1.id,
            redirectUrl: 'https://example.com/redirect',
            createdAt: new Date(Date.now() - 10 * 60 * 1000), // 10分前に作成
            expiresAt: new Date(Date.now() - 5 * 60 * 1000) // 5分前に有効期限切れ
          }
        });

        const app = await createApp();
        const response = await request(app)
          .get(I_PATH)
          .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);

        // Check response
        expect(response.status).toBe(200);
        const body = response.body;
        expect(body).toHaveProperty('hasPendingRedirect', false);
      });
      // pendingRedirectがなければfalseを返す
      test('when there is no pendingRedirect, should return false', async () => {
        const app = await createApp();
        const response = await request(app)
          .get(I_PATH)
          .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);

        // Check response
        expect(response.status).toBe(200);
        const body = response.body;
        expect(body).toHaveProperty('hasPendingRedirect', false);
      });
    });
  });

  // ユーザ情報を更新したとき
  describe('when updating user info', () => {
    // 正しいデータの場合
    describe('with correct data', () => {
      // ユーザー情報が更新される
      describe('should update user info', () => {
      });
      // 不正なデータの場合
      describe('with incorrect data', () => {
      });
    });
  });
});
// 認証済みではない場合
describe('when not authenticated', () => {
});
