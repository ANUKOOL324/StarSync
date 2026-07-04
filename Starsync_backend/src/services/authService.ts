import bcrypt from "bcrypt";

import { prisma } from "../prisma/client";
import type { LoginInput, SignupInput } from "../validations/authValidation";
import { HttpError } from "../utils/HttpError";

const SALT_ROUNDS = 12;

type SafeUser = {
  id: string;
  username: string;
  email: string;
  createdAt: Date;
};

const toSafeUser = (user: SafeUser): SafeUser => {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    createdAt: user.createdAt,
  };
};

export const signupUser = async (input: SignupInput) => {
  const existingUser = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (existingUser) {
    throw new HttpError(409, "Email is already registered");
  }

  const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      username: input.username,
      email: input.email,
      password: hashedPassword,
    },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  return {
    user: toSafeUser(user),
  };
};

export const loginUser = async (input: LoginInput) => {
  const user = await prisma.user.findUnique({
    where: { email: input.email },
  });

  if (!user) {
    throw new HttpError(401, "Invalid email or password");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.password);

  if (!passwordMatches) {
    throw new HttpError(401, "Invalid email or password");
  }

  return {
    user: toSafeUser(user),
  };
};

export const getCurrentUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
      createdAt: true,
    },
  });

  if (!user) {
    throw new HttpError(404, "User not found");
  }

  return toSafeUser(user);
};
