import request from "supertest";
import { createApp } from "@/app";
import { fixtures } from "test/fixtures";
import prisma from "@/prisma";
import { expect, test, describe, beforeAll, vitest } from "vitest";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

const AUTHENTICATE_PATH = '/authenticate';
const VERIFY_PATH = '/verify';
const JWKS_PATH = '/.well-known/jwks.json';
const TARGET_KID = 'default';

describe('Issue token', () => {
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

  // JWKSで検証
  describe('when verifying the token using JWKS', async () => {
    test('should verify the token successfully', async () => {
      const jwks = jwksResponse.body;
      const key = jwks.keys.find((k: any) => k.kid === TARGET_KID);

      const publicKey = jwkToPem(key);
      const decoded = jwt.verify(token, publicKey, { algorithms: [key.alg] }) as any;

      expect(decoded).toBeDefined();
      expect(decoded).toHaveProperty('sub', fixtures.sessions.session1.id);
    });
  });

  // verify endpointで検証
  describe('when verifying the token using /verify endpoint', async () => {
    let verifyResponse: request.Response;
    beforeAll(async () => {
      verifyResponse = await request(app)
        .post(VERIFY_PATH)
        .send({ token });
    });

    test('should return 200', () => {
      expect(verifyResponse.status).toBe(200);
    });

    test('should return valid true and payload with sub', () => {
      expect(verifyResponse.body).toHaveProperty('valid', true);
      expect(verifyResponse.body).toHaveProperty('payload');
      expect(verifyResponse.body.payload).toHaveProperty('sub', fixtures.sessions.session1.id);
    });
  });
});

