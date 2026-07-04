import dotenv from "dotenv";

dotenv.config();

const readRequiredEnv = (key: string): string => {
  const value = process.env[key]?.trim();

  if (!value) {
    throw new Error(`${key} is required`);
  }

  return value;
};

const readOptionalEnv = (key: string, fallback: string): string => {
  const value = process.env[key]?.trim();

  return value || fallback;
};

const readNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clientOrigin = readOptionalEnv("CLIENT_ORIGIN", "http://localhost:5173");

export const env = {
  nodeEnv: readOptionalEnv("NODE_ENV", "development"),
  port: readNumber(process.env.PORT, 3001),
  clientOrigin,
  frontendUrl: readOptionalEnv("FRONTEND_URL", clientOrigin),
  databaseUrl: readRequiredEnv("DATABASE_URL"),
  codeRunnerUrl: readOptionalEnv("CODE_RUNNER_URL", "http://localhost:2000/api/v2"),
  liveblocksSecretKey: process.env.LIVEBLOCKS_SECRET_KEY?.trim() ?? "",
  redisUrl: readOptionalEnv("REDIS_URL", "redis://localhost:6379"),
  sessionCookieName: readOptionalEnv("SESSION_COOKIE_NAME", "sid"),
  sessionTtlSeconds: readNumber(process.env.SESSION_TTL_SECONDS, 604800),
};
