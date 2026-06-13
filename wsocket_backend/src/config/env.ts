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

export const env = {
  port: readNumber(process.env.PORT, 3001),
  clientOrigin: readOptionalEnv("CLIENT_ORIGIN", "http://localhost:5173"),
  databaseUrl: readRequiredEnv("DATABASE_URL"),
  jwtSecret: readRequiredEnv("JWT_SECRET"),
  jwtExpiresIn: readOptionalEnv("JWT_EXPIRES_IN", "7d"),
  codeRunnerUrl: readOptionalEnv("CODE_RUNNER_URL", "http://localhost:2000/api/v2"),
  liveblocksSecretKey: process.env.LIVEBLOCKS_SECRET_KEY?.trim() ?? "",
};
