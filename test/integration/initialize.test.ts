import request from "supertest";
import { createApp } from "@/app";
import { expect, test, beforeAll, afterAll, vitest } from 'vitest';

const INITIALIZE_REG_PATH = '/initialize';

// テストのテスト
test('Test framework is working', async () => {

  vitest.mock('@prisma/client');
  const response = await request(await createApp()).get('/initialize').send();

  console.log(response.body);
});
