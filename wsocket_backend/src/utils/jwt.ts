import jwt, { type SignOptions } from "jsonwebtoken";

import { env } from "../config/env";

export type JwtPayload = {
  userId: string;
  email: string;
};

export const signAuthToken = (payload: JwtPayload) => {
  const expiresIn = env.jwtExpiresIn as NonNullable<SignOptions["expiresIn"]>;
  const options: SignOptions = {
    expiresIn,
  };

  return jwt.sign(payload, env.jwtSecret, options);
};

export const verifyAuthToken = (token: string) => jwt.verify(token, env.jwtSecret) as JwtPayload;
