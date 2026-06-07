import { z } from "zod";

export const userSearchSchema = z.object({
  query: z.string().trim().min(1, "Search query is required").max(80),
});
