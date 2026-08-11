import { env } from "../config/env";

export const getSocketAllowedOrigins = (): string[] => {
  return Array.from(
    new Set([
      env.frontendUrl,
      env.clientOrigin,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
      "http://localhost:5174",
      "http://127.0.0.1:5174",
    ]),
  );
};
