import z from '@/zod';

export const UserSchema = z.object({
  id: z.string().openapi({ description: 'ユーザーID', example: 'V1StGXR8_Z5jdHi6B-myT' }),
  displayName: z.string().min(1).max(100).nullable().openapi({ description: '表示名', example: '山田 太郎' }), // 名称未設定のユーザーも存在しうるため
  isInitialized: z.boolean().openapi({ description: 'ユーザーが初期化されているかどうか', example: true }),
}).openapi('User');

export const ApiUserSchema = UserSchema.omit({
  isInitialized: true,
}).openapi('ApiUser');

export const UserWithSessionSchema = UserSchema.extend({
  hasPendingRedirect: z.boolean().openapi({ description: 'ユーザーに保留中のリダイレクトがあるかどうか', example: false }),
}).openapi('UserWithSession');

export const ApiUserWithSessionSchema = ApiUserSchema.extend({
  hasPendingRedirect: z.boolean().openapi({ description: 'ユーザーに保留中のリダイレクトがあるかどうか', example: false }),
}).openapi('ApiUserWithSession');

export type User = z.infer<typeof UserSchema>;
export type UserWithSession = z.infer<typeof UserWithSessionSchema>;
export type ApiUser = z.infer<typeof ApiUserSchema>;
export type ApiUserWithSession = z.infer<typeof ApiUserWithSessionSchema>;
