import { z } from "zod";

export const messageParamsSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
});

export const messageQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((value) => {
      const parsed = Number(value ?? 50);
      return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), 100) : 50;
    }),
  cursor: z.string().trim().min(1).optional(),
});
