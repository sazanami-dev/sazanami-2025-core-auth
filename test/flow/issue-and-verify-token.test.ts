import request from "supertest";
import { createApp } from "@/app";
import { fixtures } from "test/fixtures";
import prisma from "@/prisma";
import { expect, test, describe, beforeAll, afterAll, beforeEach, vitest } from "vitest";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

const AUTHENTICATE_PATH = '/authenticate';
const JWKS_PATH = '/.well-known/jwks.json';
const TARGET_KID = 'default';

describe('Issue and verify token with JWKS flow', () => {
  vitest.mock('@prisma/client');
  let token: string, app: any;
  let authResponse: request.Response;
  let jwksResponse: request.Response;
  beforeAll(async () => {
    await prisma.user.create({
      data: fixtures.users.user1
    });
    await prisma.session.create({
      data: fixtures.sessions.session1
    });
    await prisma.registrationCode.create({
      data: fixtures.registrationCodes.regCode1
    });
    app = await createApp();
  });

  // authenticate
  describe('when authenticating and issuing token', () => {
    beforeAll(async () => {
      authResponse = await request(app)
        .get(AUTHENTICATE_PATH)
        .set('Cookie', [`sessionId=${fixtures.sessions.session1.id}`])
        .query({
          redirectUrl: 'https://example.com/callback',
        }).send();
    });

    test('should return 302 redirect', () => {
      expect(authResponse.status).toBe(302);
      expect(authResponse.headers).toHaveProperty('location');
    });
    test('should have token in redirect URL', () => {
      const location = authResponse.headers['location'];
      const url = new URL(location);
      token = url.searchParams.get('token') || '';

      expect(token).toBeTruthy();
    });
  });

  // fetch JWKS
  describe('when fetching JWKS', () => {
    beforeAll(async () => {
      jwksResponse = await request(app)
        .get(JWKS_PATH)
        .send();

    });
    test('should return 200', () => {
      expect(jwksResponse.status).toBe(200);
    });
    test('should return JWKS with keys array', () => {
      expect(jwksResponse.body).toHaveProperty('keys');
      expect(Array.isArray(jwksResponse.body.keys)).toBe(true);
      expect(jwksResponse.body.keys.length).toBeGreaterThan(0);
    });
  });

  // verify
  describe('when verifying token', () => {
    test('should verify the token successfully', async () => {
      const jwks = jwksResponse.body;
      const key = jwks.keys.find((k: any) => k.kid === TARGET_KID);

      const publicKey = jwkToPem(key);
      const decoded = jwt.verify(token, publicKey, { algorithms: [key.alg] }) as any;

      expect(decoded).toBeDefined(); // デコードされているということは検証に成功しているため
      expect(decoded).toHaveProperty('sub', fixtures.sessions.session1.id);
    });
  });
});

// 検証を肩代わりするAPIを使用するフロー
describe.skip('Issue and verify token with helper API flow', () => {
  // TODO: 本体を実装してから
});
