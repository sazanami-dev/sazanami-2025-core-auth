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
});

// 認証済みのセッションを持っている場合
describe('when having an authenticated session', () => {
  // ユーザー情報を取得したとき
  describe('when fetching user info', () => {
    // 正しいユーザー情報が返る
    test('should return correct user info', async () => {
    });
    // pendingRedirectが正しく処理される
    describe('should handle pendingRedirect correctly', () => {
      // 有効期限内のpendigRedirectがあれば、trueを返す
      test('when there is a pendingRedirect within the valid period, should return true', async () => {
      });
      // 有効期限切れのpendingRedirectがあってもtrueを返さない
      test('when there is an expired pendingRedirect, should not return true', async () => {
      });
      // pendingRedirectがなければfalseを返す
      test('when there is no pendingRedirect, should return false', async () => {
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
