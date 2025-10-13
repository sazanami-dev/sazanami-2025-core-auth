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

