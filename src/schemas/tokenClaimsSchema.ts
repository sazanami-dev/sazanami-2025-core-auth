import z from "@/zod";

export const TokenClaimsSchema = z.object({
  // Common Claims
  sub: z.string(), // Subject: Identifier for the user
  iss: z.string(), // Issuer: Issuer of the token
  aud: z.string().optional(), // Audience: Audience for the token
  exp: z.number(), // Expiration Time
  nbf: z.number().optional(), // Not Before
  iat: z.number(), // Issued At

  // Custom Claims
  jti: z.string().optional(), // JWT ID: Unique identifier for the token
  uid: z.string(), // User ID: Custom claim for user identification
}).openapi('TokenClaims');

export type TokenClaims = z.infer<typeof TokenClaimsSchema>;
