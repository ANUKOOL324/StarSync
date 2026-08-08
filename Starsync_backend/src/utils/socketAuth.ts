import { SESSION_COOKIE_NAME } from "../config/session";
import { getSession } from "../services/sessionService";
import type { SocketUser } from "../types/websocket";

export type SocketCookieAuthResult =
  | {
      ok: true;
      user: SocketUser;
    }
  | {
      ok: false;
      reason: "missing" | "invalid";
    };

export const parseCookieHeader = (cookieHeader: string | undefined): Record<string, string> => {
  if (!cookieHeader) {
    return {};
  }

  return cookieHeader.split(";").reduce<Record<string, string>>((cookies, cookiePair) => {
    const [rawName, ...rawValueParts] = cookiePair.split("=");
    const name = rawName?.trim();

    if (!name) {
      return cookies;
    }

    const rawValue = rawValueParts.join("=").trim();

    cookies[name] = decodeURIComponent(rawValue);
    return cookies;
  }, {});
};

export const getSessionIdFromCookieHeader = (cookieHeader: string | undefined): string | null => {
  const cookies = parseCookieHeader(cookieHeader);
  const sessionId = cookies[SESSION_COOKIE_NAME];

  return sessionId || null;
};

export const authenticateSocketCookie = async (
  cookieHeader: string | undefined,
): Promise<SocketCookieAuthResult> => {
  const sessionId = getSessionIdFromCookieHeader(cookieHeader);

  if (!sessionId) {
    return { ok: false, reason: "missing" };
  }

  const session = await getSession(sessionId);

  if (!session) {
    return { ok: false, reason: "invalid" };
  }

  return {
    ok: true,
    user: {
      id: session.userId,
      username: session.username,
      email: session.email,
    },
  };
};
