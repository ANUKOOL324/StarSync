import type { CookieOptions } from "express";

import { env } from "./env";

export const SESSION_COOKIE_NAME = env.sessionCookieName;
export const SESSION_TTL_SECONDS = env.sessionTtlSeconds;

export const sessionCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  maxAge: SESSION_TTL_SECONDS * 1000,
  path: "/",
};

export const clearSessionCookieOptions: CookieOptions = {
  httpOnly: sessionCookieOptions.httpOnly,
  secure: sessionCookieOptions.secure,
  sameSite: sessionCookieOptions.sameSite,
  path: sessionCookieOptions.path,
};
