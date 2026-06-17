import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const optionalMaxMembersSchema = z
  .number({ message: "Member limit must be a number" })
  .int("Member limit must be a whole number")
  .min(2, "Member limit must be at least 2")
  .max(500, "Member limit is too large")
  .nullable()
  .optional();

const roomPurposeSchema = z.enum(["COLLABORATIVE", "COMPETING"]);
const problemDifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);

export const createRoomSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters").max(60),
  slug: z
    .string()
    .trim()
    .min(2, "Room slug must be at least 2 characters")
    .max(60)
    .regex(slugPattern, "Use lowercase letters, numbers, and hyphens only")
    .optional(),
  maxMembers: optionalMaxMembersSchema,
  unlimitedMembers: z.boolean().optional(),
});

export const joinRoomSchema = z.object({
  joinCode: z.string().trim().min(3, "Room code is required").max(24),
});

export const updateRoomSchema = z.object({
  name: z.string().trim().min(2, "Room name must be at least 2 characters").max(60).optional(),
  maxMembers: optionalMaxMembersSchema,
  unlimitedMembers: z.boolean().optional(),
});

export const roomParamsSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
});

export const roomMemberParamsSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
  userId: z.string().trim().min(1, "User id is required"),
});

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
