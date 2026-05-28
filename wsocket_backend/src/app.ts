import cors from "cors";
import express from "express";

import { env } from "./config/env";
import { authRoutes } from "./routes/authRoutes";
import { healthRoutes } from "./routes/healthRoutes";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFoundHandler";

export const app = express();

app.use(cors({ origin: [env.clientOrigin, "http://127.0.0.1:5173"] }));
app.use(express.json());

app.use("/api", healthRoutes);
app.use("/api/v1/auth", authRoutes);

app.use(notFoundHandler);
app.use(errorHandler);
