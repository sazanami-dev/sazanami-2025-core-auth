import request from "supertest";
import { createApp } from "@/app";
import { EnvUtil, EnvKey } from "@/utils/env-util";
import { expect, test, beforeEach, vitest, describe } from 'vitest';
import { fixtures } from "test/fixtures";
import prisma from "@/prisma";

const INITIALIZE_REG_PATH = '/initialize';

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
  let app, response: request.Response;
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
    let app, response: request.Response;
    beforeEach(async () => {
      app = await createApp();
      response = await request(app)
        .get(INITIALIZE_REG_PATH);
    });

    test('should respond with 400 Bad Request', () => {
      expect(response.status).toBe(400);
    });
    test('should return error message about missing regCode', () => {
      expect(response.body).toBeDefined();
      expect(response.body.message).toBe('regCode query parameter is required');
    });
  });

  describe('when regCode is invalid', () => {
    let app, response: request.Response;
    beforeEach(async () => {
      app = await createApp();
      response = await request(app)
        .get(INITIALIZE_REG_PATH)
        .query({ regCode: 'invalid-code' });
    });
    test('should respond with 400 Bad Request', () => {
      expect(response.status).toBe(400);
    });
    test('should return error message about invalid regCode', () => {
      expect(response.body).toBeDefined();
      expect(response.body.message).toBe('Invalid regCode');
    });
  });
});
