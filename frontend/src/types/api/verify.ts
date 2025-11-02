import z from "zod";
import { TokenClaimsSchema } from "../tokenClaims";

export const VerifyRequestSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const VerifyResponseSchema = z.object({
  valid: z.boolean(),
  claims: TokenClaimsSchema.optional(),
});

export type VerifyRequest = z.infer<typeof VerifyRequestSchema>;
export type VerifyResponse = z.infer<typeof VerifyResponseSchema>;
