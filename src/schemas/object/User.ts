import z from '@/zod';

export const UserSchema = z.object({
  id: z.nanoid().openapi({ description: 'ユーザーID', example: 'V1StGXR8_Z5jdHi6B-myT' }),
  displayName: z.string().min(1).max(100).nullable().openapi({ description: '表示名', example: '山田 太郎' }), // 名称未設定のユーザーも存在しうるため
}).openapi('User');
