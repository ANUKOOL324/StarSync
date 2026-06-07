import dotenv from "dotenv";

dotenv.config();

const readNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: readNumber(process.env.PORT, 3001),
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:5173",
  databaseUrl: process.env.DATABASE_URL ?? "",
  jwtSecret: process.env.JWT_SECRET ?? "replace-this-development-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  codeRunnerUrl: process.env.CODE_RUNNER_URL ?? "https://emkc.org/api/v2/piston",
  liveblocksSecretKey: process.env.LIVEBLOCKS_SECRET_KEY ?? "",
};
