import z from '@/zod';
import { TokenClaimsSchema } from '../object/tokenClaims';

export const VerifyRequestSchema = z.object({
  token: z.string().openapi({ description: '検証トークン', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
}).openapi({ description: '検証リクエストのスキーマ' });

export const VerifyResponseSchema = z.object({
  valid: z.boolean().openapi({ description: 'トークンが有効かどうか', example: true }),
  payload: TokenClaimsSchema.optional().openapi({ description: 'トークンのペイロード（有効な場合のみ）' }),
}).openapi({ description: '検証レスポンスのスキーマ' });

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
