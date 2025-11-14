import request from "supertest";
import { createApp } from "@/app";
import { expect, test, beforeEach, afterEach, vitest, describe } from "vitest";
import prisma from "@/prisma";
import { fixtures } from "test/fixtures";
import { EnvUtil, EnvKey } from "@/utils/env-util";

const REDIRECT_PATH = '/redirect';

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
    data: {
      ...fixtures.users.user1,
      isInitialized: true,
    }
  });
  await prisma.session.create({
    data: fixtures.sessions.session1
  });
});

afterEach(() => {
  vitest.clearAllMocks();
});

describe('Redirect route', () => {
  test('should redirect to error page when sessionId cookie is missing', async () => {
    const app = await createApp();
    const response = await request(app).get(REDIRECT_PATH);

    expectRedirectToErrorPage(response, {
      code: 'SESSION_ID_MISSING',
      message: 'セッションIDが見つかりません。',
      detail: 'sessionId cookie is required!',
    });
  });

  test('should redirect to error page when pending redirect does not exist', async () => {
    const app = await createApp();
    const response = await request(app)
      .get(REDIRECT_PATH)
      .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);

    expectRedirectToErrorPage(response, {
      code: 'PENDING_REDIRECT_NOT_FOUND',
      message: '保留中のリダイレクトが見つかりません。',
      detail: 'No pending redirect found for this session or it has expired.',
    });
  });

  describe('when pending redirect exists without postbackUrl', () => {
    let app, response: request.Response;
    beforeEach(async () => {
      await prisma.pendingRedirect.create({
        data: {
          id: 'pending-redirect-without-postback',
          sessionId: fixtures.sessions.session1.id,
          redirectUrl: 'https://example.com/redirect',
          state: 'xyz',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        }
      });
      app = await createApp();
      response = await request(app)
        .get(REDIRECT_PATH)
        .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);
    });

    test('should append token and state to redirectUrl', () => {
      expect(response.status).toBe(302);
      expect(response.headers.location).toMatch(/^https:\/\/example.com\/redirect\?token=.+&state=xyz$/);
    });
  });

  describe('when pending redirect includes postbackUrl', () => {
    let app, response: request.Response, fetchMock: ReturnType<typeof vitest.spyOn>;
    beforeEach(async () => {
      await prisma.pendingRedirect.create({
        data: {
          id: 'pending-redirect-with-postback',
          sessionId: fixtures.sessions.session1.id,
          redirectUrl: 'https://example.com/redirect',
          postbackUrl: 'https://example.com/postback',
          state: 'xyz',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        }
      });

      fetchMock = vitest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ success: true }),
      } as Response);

      app = await createApp();
      response = await request(app)
        .get(REDIRECT_PATH)
        .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);
    });

    afterEach(() => {
      fetchMock?.mockRestore();
    });

    test('should post token and state to the configured postbackUrl', () => {
      expect(fetchMock).toHaveBeenCalledWith('https://example.com/postback', expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      }));
      const [, fetchOptions] = fetchMock.mock.calls[0];
      const parsedBody = JSON.parse((fetchOptions as RequestInit).body as string);
      expect(parsedBody).toHaveProperty('token');
      expect(parsedBody).toHaveProperty('state', 'xyz');
    });

    test('should redirect to redirectUrl without query params when postback succeeded', () => {
      expect(response.status).toBe(302);
      expect(response.headers.location).toBe('https://example.com/redirect');
    });
  });

  test('should reject invalid redirectUrl definitions', async () => {
    await prisma.pendingRedirect.create({
      data: {
        id: 'pending-redirect-invalid-url',
        sessionId: fixtures.sessions.session1.id,
        redirectUrl: 'invalid-url',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      }
    });

    const app = await createApp();
    const response = await request(app)
      .get(REDIRECT_PATH)
      .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`]);

    expectRedirectToErrorPage(response, {
      code: 'INVALID_URL',
      message: '無効なURLです。',
      detail: 'redirectUrl or postbackUrl is not a valid URL.',
    });
  });
});
