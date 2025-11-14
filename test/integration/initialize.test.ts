import request from "supertest";
import { createApp } from "@/app";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { expect, test, beforeEach, vitest, describe } from 'vitest';
import { fixtures } from "test/fixtures";
import prisma from "@/prisma";
import type { Express } from "express";

const INITIALIZE_REG_PATH = '/initialize';

function expectRedirectToErrorPage(response: request.Response, expected: { code: string; message?: string; detail?: string; }) {
  expect(response.status).toBe(302);
  expect(response.headers.location).toBeDefined();

  const redirectedUrl = new URL(response.headers.location);
  const errorBase = new URL(EnvUtil.get(EnvKey.ERROR_PAGE));

  expect(`${redirectedUrl.origin}${redirectedUrl.pathname}`).toBe(`${errorBase.origin}${errorBase.pathname}`);
  expect(redirectedUrl.searchParams.get('code')).toBe(expected.code);
  if (expected.message) {
    expect(redirectedUrl.searchParams.get('message')).toBe(expected.message);
  }
  if (expected.detail) {
    expect(redirectedUrl.searchParams.get('detail')).toBe(expected.detail);
  }
}

beforeEach(async () => {
  vitest.mock('@prisma/client');
  await prisma.user.create({
    data: fixtures.users.user1
  });

  await prisma.registrationCode.create({
    data: fixtures.registrationCodes.regCode1
  });
});

describe('Initialization with valid registration code', async () => {
  let app: Express, response: request.Response;
  beforeEach(async () => {
    app = await createApp();
    response = await request(app)
      .get(INITIALIZE_REG_PATH)
      .query({ regCode: fixtures.registrationCodes.regCode1.code });
  });

  // 302リダイレクトされること
  test('should respond with a redirect', () => {
    expect(response.status).toBe(302);
  });
  // locationヘッダーに初期設定ページのURLが含まれること
  test('should redirect to the account initialization page with token', () => {
    expect(response.headers.location).toBeDefined();
    expect(response.headers.location).toMatch(new RegExp(`^${EnvUtil.get(EnvKey.ACCOUNT_INITIALIZATION_PAGE)}\\?token=`));
  });

  // セッションIDがcookieにセットされていること
  test('should set a sessionId cookie', () => {
    expect(response.headers['set-cookie']).toBeDefined();
    const sessionCookie = response.headers['set-cookie'][0].split(';').find((part: string) => part.trim().startsWith('sessionId='));
    expect(sessionCookie).toBeDefined();
  });

  // TODO: 匿名セッションがあったときにPendingRedirectを引き継いだりする挙動をテストする
});

describe('Initialization with invalid registration code', async () => {
  describe('when regCode is missing', () => {
    let app: Express, response: request.Response;
    beforeEach(async () => {
      app = await createApp();
      response = await request(app)
        .get(INITIALIZE_REG_PATH);
    });

    test('should redirect to error page explaining the missing regCode', () => {
      expectRedirectToErrorPage(response, {
        code: 'REQUIRED_PARAMETER_MISSING',
        message: '必須パラメーターが欠落しています。',
        detail: 'regCode query parameter is required!',
      });
    });
  });

  describe('when regCode is invalid', () => {
    let app: Express, response: request.Response;
    beforeEach(async () => {
      app = await createApp();
      response = await request(app)
        .get(INITIALIZE_REG_PATH)
        .query({ regCode: 'invalid-code' });
    });
    test('should redirect to error page explaining the invalid regCode', () => {
      expectRedirectToErrorPage(response, {
        code: 'INVALID_REGCODE',
        message: '無効な登録コードです。',
        detail: 'regCode is invalid or expired.',
      });
    });
  });

  describe('when user is already initialized and has a pending redirect', () => {
    const initializedUser = {
      ...fixtures.users.user2,
      isInitialized: true,
    };
    const initializedSession = {
      id: 'initialized-session-1',
      userId: initializedUser.id,
    };
    const initializedRegCode = {
      code: 'INITIALIZED',
      userId: initializedUser.id,
    };
    const pendingRedirectBase = {
      id: 'pending-initialized',
      sessionId: initializedSession.id,
      redirectUrl: 'https://example.com/pending-redirect',
      postbackUrl: null,
      state: 'pending-state',
    };

    let app: Express, response: request.Response;
    beforeEach(async () => {
      await prisma.user.create({ data: initializedUser });
      await prisma.registrationCode.create({ data: initializedRegCode });
      await prisma.session.create({ data: initializedSession });
      await prisma.pendingRedirect.create({
        data: {
          ...pendingRedirectBase,
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        }
      });

      app = await createApp();
      response = await request(app)
        .get(INITIALIZE_REG_PATH)
        .set('Cookie', [`sessionId=${initializedSession.id}`])
        .query({ regCode: initializedRegCode.code });
    });

    test('should immediately send the user back to /redirect to resume the flow', () => {
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('/redirect');
    });

    test('should keep reusing the existing authenticated session', () => {
      const rawCookieHeader = response.headers['set-cookie'];
      const cookieHeader = Array.isArray(rawCookieHeader) ? rawCookieHeader : rawCookieHeader ? [rawCookieHeader] : undefined;
      expect(cookieHeader).toBeDefined();
      const sessionCookie = cookieHeader!.find((cookie: string) => cookie.startsWith('sessionId='));
      expect(sessionCookie).toBeDefined();
      expect(sessionCookie).toContain(`sessionId=${initializedSession.id}`);
    });
  });
});
