import z from '@/zod';
import { UserSchema } from '../object/User';

export const AuthenticateRequestQuerySchema = z.object({
  redirect_uri: z.string().openapi({ description: 'リダイレクト先のURI' }),
  state: z.string().optional().openapi({ description: 'CSRF対策用のランダムな文字列(コールバック元の判別, CSRF対策などに使用可能)' }),
}).openapi({ description: '認証リクエストのクエリパラメータ' });

export const AuthenticateResponseSchema = z.object({
  user: UserSchema,
  token: z.string().openapi({ description: '認証トークン', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }),
  state: z.string().optional().openapi({ description: 'リクエスト時に指定されたstateパラメータ', example: 'random_state' }),
}).openapi({ description: '認証成功時のレスポンス' });
