import type { Request, Response } from "express";

import {
  getOrCreateEditorDocument,
  runCode,
  updateEditorDocument,
} from "../services/editorService";
import { HttpError } from "../utils/HttpError";
import {
  editorLanguageSchema,
  editorParamsSchema,
  runCodeSchema,
  updateEditorDocumentSchema,
} from "../validations/editorValidation";

const rejectUnsupportedLanguage = (body: unknown) => {
  const requestBody = body as { language?: unknown };

  if (typeof requestBody.language !== "string") {
    return;
  }

  const languageResult = editorLanguageSchema.safeParse(requestBody.language);

  if (!languageResult.success) {
    throw new HttpError(400, "Unsupported language.");
  }
};

export const getEditorDocumentController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = editorParamsSchema.parse(request.params);
  const document = await getOrCreateEditorDocument(roomId, request.user.userId);

  response.status(200).json({ document });
};

export const updateEditorDocumentController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  const { roomId } = editorParamsSchema.parse(request.params);
  rejectUnsupportedLanguage(request.body);
  const input = updateEditorDocumentSchema.parse(request.body);
  const document = await updateEditorDocument(roomId, request.user.userId, input);

  response.status(200).json({ document });
};

export const runCodeController = async (request: Request, response: Response) => {
  if (!request.user) {
    throw new HttpError(401, "Unauthorized");
  }

  rejectUnsupportedLanguage(request.body);
  const input = runCodeSchema.parse(request.body);
  const result = await runCode(input, request.user.userId);

  response.status(200).json({ result });
};
