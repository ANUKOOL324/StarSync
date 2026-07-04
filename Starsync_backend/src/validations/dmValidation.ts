import { z } from "zod";

export const createDmSchema = z.object({
  userId: z.string().trim().min(1, "Target user id is required"),
  sourceRoomId: z.string().trim().min(1, "Source room id is required").optional(),
});

export type CreateDmInput = z.infer<typeof createDmSchema>;
