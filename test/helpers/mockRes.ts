import type { Response } from 'express';
import { vitest } from 'vitest';

export const makeMockRes = (): Response & {
  status: ReturnType<typeof vitest.fn>;
  json: ReturnType<typeof vitest.fn>;
  redirect: ReturnType<typeof vitest.fn>;
  headersSent: boolean;
} => {
  return {
    status: vitest.fn().mockReturnThis(),
    json: vitest.fn(),
    redirect: vitest.fn(),
    headersSent: false,
  } as any;
};
