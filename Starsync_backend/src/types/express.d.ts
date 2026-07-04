type AuthenticatedRequestUser = {
  userId: string;
  username: string;
  email: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedRequestUser;
    }
  }
}

export {};
