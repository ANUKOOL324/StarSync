import { z } from "zod";

import { editorLanguageSchema } from "./editorValidation";

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
const supportedDurationOptions = [15, 30, 45, 60] as const;

export const createRoomSchema = z
  .object({
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
    purpose: roomPurposeSchema.optional(),
    difficulty: problemDifficultySchema.optional(),
    topics: z.array(z.string().trim().min(1).max(40)).max(10, "Too many topics selected").optional(),
    problemCount: z
      .number({ message: "Problem count must be a number" })
      .int("Problem count must be a whole number")
      .min(1, "Choose at least 1 problem")
      .max(10, "Choose 10 problems or fewer")
      .optional(),
    durationMinutes: z
      .number({ message: "Duration must be a number" })
      .int("Duration must be a whole number")
      .refine((value) => supportedDurationOptions.includes(value as (typeof supportedDurationOptions)[number]), {
        message: "Choose 15, 30, 45, or 60 minutes",
      })
      .optional(),
  })
  .superRefine((input, context) => {
    const roomPurpose = input.purpose ?? "COLLABORATIVE";

    if (roomPurpose !== "COMPETING") {
      return;
    }

    if (!input.difficulty) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Difficulty is required for a competing room",
        path: ["difficulty"],
      });
    }

    if (!input.durationMinutes) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Duration is required for a competing room",
        path: ["durationMinutes"],
      });
    }
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

export const runRoomProblemCodeSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
  problemId: z.string().trim().min(1, "Problem id is required"),
  language: editorLanguageSchema,
  code: z.string().min(1, "Code is required").max(100_000, "Code must be 100,000 characters or less"),
});

export const roomMemberParamsSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
  userId: z.string().trim().min(1, "User id is required"),
});

export type RunRoomProblemCodeInput = z.infer<typeof runRoomProblemCodeSchema>;
export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type JoinRoomInput = z.infer<typeof joinRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
