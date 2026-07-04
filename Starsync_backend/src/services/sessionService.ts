import { randomBytes } from "node:crypto";

import { redis } from "../config/redis";
import { SESSION_TTL_SECONDS } from "../config/session";

type SessionUser = {
  id: string;
  username: string;
  email: string;
};

export type SessionData = {
  userId: string;
  username: string;
  email: string;
};

const SESSION_KEY_PREFIX = "session:";

const getSessionKey = (sessionId: string) => `${SESSION_KEY_PREFIX}${sessionId}`;

export const createSession = async (user: SessionUser): Promise<string> => {
  const sessionId = randomBytes(32).toString("hex");
  const sessionData: SessionData = {
    userId: user.id,
    username: user.username,
    email: user.email,
  };

  await redis.set(getSessionKey(sessionId), JSON.stringify(sessionData), "EX", SESSION_TTL_SECONDS);

  return sessionId;
};

export const getSession = async (sessionId: string): Promise<SessionData | null> => {
  const sessionJson = await redis.get(getSessionKey(sessionId));

  if (!sessionJson) {
    return null;
  }

  try {
    return JSON.parse(sessionJson) as SessionData;
  } catch (error) {
    console.error("Failed to parse session data", error);
    return null;
  }
};

export const destroySession = async (sessionId: string): Promise<void> => {
  await redis.del(getSessionKey(sessionId));
};
