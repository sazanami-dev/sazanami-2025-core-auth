import request from "supertest";
import { createApp } from "@/app";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { expect, test, beforeEach, vitest, describe } from 'vitest';
import { fixtures } from "test/fixtures";
import prisma from "@/prisma";

const AUTHENTICATE_PATH = '/authenticate';

beforeEach(async () => {
  vitest.mock('@prisma/client');
  await prisma.user.create({
    data: fixtures.users.user1
  });
});

// すでに有効なセッションを持っている場合
describe('Authenticate with existing valid session', async () => {
  // 認証済みの場合
  describe('when already authenticated', () => {
    beforeEach(async () => {
      await prisma.session.create({
        data: fixtures.sessions.session1
      });
    });
    // postbackUrlがあれば
    describe('with postbackUrl', async () => {
      let app, response: request.Response, fetchMock: any;
      beforeEach(async () => {
        app = await createApp();
        fetchMock = vitest.spyOn(global, 'fetch').mockImplementation(() => Promise.resolve({
          ok: true,
          status: 200,
          json: async () => ({ success: true })
        } as Response));
        response = await request(app)
          .get(AUTHENTICATE_PATH)
          .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`])
          .query({
            redirectUrl: 'https://example.com/redirect',
            postbackUrl: 'https://example.com/postback',
            state: 'xyz'
          });
      });
      // postbackUrlにトークンとstateをPOSTする
      test('should post token and state to postbackUrl', () => {
        expect(fetchMock).toHaveBeenCalledWith('https://example.com/postback', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('"token":')
        }));
        const body = JSON.parse((fetchMock.mock.calls[0][1] as any).body);
        expect(body).toHaveProperty('token');
        expect(body).toHaveProperty('state', 'xyz');
      });
      // redirectUrlにリダイレクトする
      test('should redirect to redirectUrl', () => {
        expect(response.status).toBe(302);
        expect(response.headers.location).toBe('https://example.com/redirect');
      });
    });
    // postbackUrlがなければ
    describe('without postbackUrl', async () => {
      let app, response: request.Response;
      beforeEach(async () => {
        app = await createApp();
        response = await request(app)
          .get(AUTHENTICATE_PATH)
          .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`])
          .query({
            redirectUrl: 'https://example.com/redirect',
            state: 'xyz'
          });
      });
      // redirectUrlにtokenとstateを付与してリダイレクトする
      test('should redirect to redirectUrl with token and state', () => {
        expect(response.status).toBe(302);
        expect(response.headers.location).toMatch(new RegExp(`^https://example.com/redirect\\?token=.+&state=xyz$`));
      });
    });
  });
  // 匿名セッションの場合
  describe('when anonymous session', async () => {
    // redirectUrlとpostbackUrlとstateを保存する
    let app, response: request.Response;
    beforeEach(async () => {
      await prisma.session.create({
        data: fixtures.sessions.anonSession1
      });
      app = await createApp();
      response = await request(app)
        .get(AUTHENTICATE_PATH)
        .set('Cookie', [`sessionId=${fixtures.sessions.anonSession1.id}`])
        .query({
          redirectUrl: 'https://example.com/redirect',
          postbackUrl: 'https://example.com/postback',
          state: 'xyz'
        });
    });
    test('should save redirectUrl, postbackUrl and state', async () => {
      return prisma.pendingRedirect.findFirst({
        where: {
          sessionId: fixtures.sessions.anonSession1.id,
          redirectUrl: 'https://example.com/redirect',
          postbackUrl: 'https://example.com/postback',
          state: 'xyz'
        }
      }).then(pending => {
        expect(pending).not.toBeNull();
      });
    });
    // 認証ページにリダイレクトする
    test('should redirect to authentication page', () => {
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe(EnvUtil.get(EnvKey.REAUTHENTICATION_PAGE));
    });
  });
});

// 有効なセッションを持っていない場合
describe('Authenticate without valid session', async () => {
  // anonymousセッションを作成する
  test('should create an anonymous session', () => {
  });
  // redirectUrlとpostbackUrlとstateを保存する
  test('should save redirectUrl, postbackUrl and state', () => {
  });
  // 認証ページにリダイレクトする
  test('should redirect to authentication page', () => {
  });
});

