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
    // postbackUrlがあれば
    describe('with postbackUrl', async () => {
      // postbackUrlにトークンとstateをPOSTする
      describe('should post token and state to postbackUrl', () => {
      });
      // redirectUrlにリダイレクトする
      describe('should redirect to redirectUrl', () => {
      });
    });
    // postbackUrlがなければ
    describe('without postbackUrl', async () => {
      // redirectUrlにtokenとstateを付与してリダイレクトする
      describe('should redirect to redirectUrl with token and state', () => {
      });
    });
  });
  // 匿名セッションの場合
  describe('when anonymous session', async () => {
    // redirectUrlとpostbackUrlとstateを保存する
    test('should save redirectUrl, postbackUrl and state', () => {
    });
    // 認証ページにリダイレクトする
    test('should redirect to authentication page', () => {
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

