import { z } from "zod";

export const editorParamsSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
});

export const editorLanguageSchema = z.enum(["c", "cpp", "javascript", "typescript", "python"], {
  error: "Unsupported language.",
});

export const updateEditorDocumentSchema = z.object({
  content: z.string().max(50_000, "Code must be 50,000 characters or less"),
  language: editorLanguageSchema,
});

export const runCodeSchema = z.object({
  roomId: z.string().trim().min(1, "Room id is required"),
  language: editorLanguageSchema,
  code: z.string().min(1, "Code is required").max(50_000, "Code must be 50,000 characters or less"),
  stdin: z.string().max(10_000, "Input must be 10,000 characters or less").optional().default(""),
});

export type EditorLanguage = z.infer<typeof editorLanguageSchema>;
export type UpdateEditorDocumentInput = z.infer<typeof updateEditorDocumentSchema>;
export type RunCodeInput = z.infer<typeof runCodeSchema>;
