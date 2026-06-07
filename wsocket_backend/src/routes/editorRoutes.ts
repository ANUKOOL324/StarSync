import { Router } from "express";

import {
  getEditorDocumentController,
  runCodeController,
  updateEditorDocumentController,
} from "../controllers/editorController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

export const editorRoutes = Router();

editorRoutes.use(requireAuth);
editorRoutes.get("/:roomId/document", asyncHandler(getEditorDocumentController));
editorRoutes.patch("/:roomId/document", asyncHandler(updateEditorDocumentController));
editorRoutes.post("/run", asyncHandler(runCodeController));
