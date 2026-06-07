import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const createRoomSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters").max(60),
  slug: z
    .string()
    .trim()
    .min(2, "Room slug must be at least 2 characters")
    .max(60)
    .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only")
    .optional(),
});

export const updateRoomSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters").max(60),
  slug: z
    .string()
    .trim()
    .min(2, "Room slug must be at least 2 characters")
    .max(60)
    .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only")
    .optional(),
});

export const roomParamsSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
