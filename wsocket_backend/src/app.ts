import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { authRoutes } from "./routes/authRoutes";
import { dmRoutes } from "./routes/dmRoutes";
import { editorRoutes } from "./routes/editorRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { messageRoutes } from "./routes/messageRoutes";
import { roomRoutes } from "./routes/roomRoutes";
import { userRoutes } from "./routes/userRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";

export const app = express();

app.use(
  cors({
    origin: [
      env.clientOrigin,
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ],
  }),
);
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/rooms", roomRoutes);
app.use("/api/v1/dms", dmRoutes);
app.use("/api/v1/editor", editorRoutes);
app.use("/api/v1/users", userRoutes);
app.use("/api/v1/messages", messageRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
