import { Router } from "express";

import {
  createRoomController,
  deleteRoomController,
  getRoomController,
  getRoomMembersController,
  getRoomProblemsController,
  getRoomsController,
  joinRoomController,
  removeRoomMemberController,
  runRoomProblemCodeController,
  submitRoomProblemCodeController,
  getRoomProblemSubmissionsController,
  updateRoomController,
} from "../controllers/roomController";
import { requireAuth } from "../middleware/authMiddleware";
import { codeExecutionRateLimiter } from "../middleware/rateLimiters";
import { asyncHandler } from "../utils/asyncHandler";

export const roomRoutes = Router();

roomRoutes.use(requireAuth);
roomRoutes.post("/", asyncHandler(createRoomController));
roomRoutes.post("/join", asyncHandler(joinRoomController));
roomRoutes.get("/", asyncHandler(getRoomsController));
roomRoutes.get("/:roomId/members", asyncHandler(getRoomMembersController));
roomRoutes.get("/:roomId/problems", asyncHandler(getRoomProblemsController));
roomRoutes.post("/:roomId/problems/run", codeExecutionRateLimiter, asyncHandler(runRoomProblemCodeController));
roomRoutes.post("/:roomId/problems/submit", codeExecutionRateLimiter, asyncHandler(submitRoomProblemCodeController));
roomRoutes.get("/:roomId/problems/:problemId/submissions", asyncHandler(getRoomProblemSubmissionsController));

roomRoutes.get("/:roomId", asyncHandler(getRoomController));
roomRoutes.patch("/:roomId", asyncHandler(updateRoomController));
roomRoutes.delete("/:roomId/members/:userId", asyncHandler(removeRoomMemberController));
roomRoutes.delete("/:roomId", asyncHandler(deleteRoomController));
