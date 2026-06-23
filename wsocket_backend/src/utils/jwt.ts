import jwt from "jsonwebtoken";
import type { StringValue } from "ms";

import { env } from "../config/env";

export type AuthTokenPayload = {
  userId: string;
  email: string;
};

export type JwtPayload = AuthTokenPayload;

export const signAuthToken = (payload: AuthTokenPayload): string => {
  
  const tokenExpiryTime = env.jwtExpiresIn as StringValue;

  const signedToken = jwt.sign(payload, env.jwtSecret, {
    expiresIn: tokenExpiryTime,
  });

  return signedToken;
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  const decodedToken = jwt.verify(token, env.jwtSecret);

  const authTokenPayload = decodedToken as AuthTokenPayload;

  return authTokenPayload;
};

