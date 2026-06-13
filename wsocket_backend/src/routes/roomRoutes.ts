import { Router } from "express";

import {
  createRoomController,
  deleteRoomController,
  getRoomController,
  getRoomMembersController,
  getRoomsController,
  joinRoomController,
  removeRoomMemberController,
  updateRoomController,
} from "../controllers/roomController";
import { requireAuth } from "../middleware/authMiddleware";
import { asyncHandler } from "../utils/asyncHandler";

export const roomRoutes = Router();

roomRoutes.use(requireAuth);
roomRoutes.post("/", asyncHandler(createRoomController));
roomRoutes.post("/join", asyncHandler(joinRoomController));
roomRoutes.get("/", asyncHandler(getRoomsController));
roomRoutes.get("/:roomId/members", asyncHandler(getRoomMembersController));
roomRoutes.get("/:roomId", asyncHandler(getRoomController));
roomRoutes.patch("/:roomId", asyncHandler(updateRoomController));
roomRoutes.delete("/:roomId/members/:userId", asyncHandler(removeRoomMemberController));
roomRoutes.delete("/:roomId", asyncHandler(deleteRoomController));
