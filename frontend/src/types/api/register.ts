import z from 'zod';

export const RegisterResponseSchema = z.object({
  regCode: z.string(),
});

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
