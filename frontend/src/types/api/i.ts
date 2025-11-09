import z from "zod";

export const IResponseSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  hasPendingRedirect: z.boolean(),
})

export type IResponse = z.infer<typeof IResponseSchema>;
