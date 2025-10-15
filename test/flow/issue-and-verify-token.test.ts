import request from "supertest";
import { createApp } from "@/app";
import { fixtures } from "test/fixtures";
import prisma from "@/prisma";
import { expect, test, describe, beforeAll, afterAll, beforeEach, vitest } from "vitest";
import jwt from "jsonwebtoken";
import jwkToPem from "jwk-to-pem";

const INITIALIZE_PATH = '/initialize';
const JWKS_PATH = '/.well-known/jwks.json';
const TARGET_KID = 'default';

describe('Issue and verify token with JWKS flow', () => {
  vitest.mock('@prisma/client');
  let token: string, app: any;
  let initResponse: request.Response;
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
  // initialzie
  describe('when initializing', () => {
    beforeAll(async () => {
      initResponse = await request(app)
        .get(INITIALIZE_PATH)
        .query({ regCode: fixtures.registrationCodes.regCode1.code })
        .send();
    });

    test('should return 302 redirect', () => {
      expect(initResponse.status).toBe(302);
      expect(initResponse.headers.location).toBeDefined();
    });
    // test('should set sessionId cookie', () => {
    //   const setCookieHeader = initResponse.headers['set-cookie'];
    //   expect(setCookieHeader).toBeDefined();
    //   const sessionIdCookie = setCookieHeader.split(',').find((cookie: string) => cookie.startsWith('sessionId='));
    //   expect(sessionIdCookie).toBeDefined();
    //   cookie = sessionIdCookie!.split(';')[0];
    // });
    test('should return token in redirect URL', () => {
      const redirectLocation = initResponse.headers['location'];
      const url = new URL(redirectLocation);
      const returnedToken = url.searchParams.get('token');
      expect(returnedToken).toBeDefined();
      token = returnedToken!;
    });
  });


  // // authorize
  // describe('when authorizing', () => {
  //   beforeAll(async () => {
  //     authResponse = await request(app)
  //       .get('/authenticate')
  //       .set('Cookie', [cookie])
  //       .query({ redirectUrl: 'https://example.com/callback' })
  //       .query({ state: 'test-state' })
  //       .send();
  //   });
  //   test('should return 302 redirect', () => {
  //     expect(authResponse.status).toBe(302);
  //     expect(authResponse.headers).toHaveProperty('location');
  //   });
  //   test('should redirect to the correct URL with token and state', () => {
  //     const redirectLocation = authResponse.headers['location'];
  //     const url = new URL(redirectLocation);
  //     expect(url.origin + url.pathname).toBe('https://example.com/callback');
  //     const returnedToken = url.searchParams.get('token');
  //     const returnedState = url.searchParams.get('state');
  //     expect(returnedToken).toBeDefined();
  //     expect(returnedState).toBe('test-state');
  //     token = returnedToken!;
  //   });
  // });

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
