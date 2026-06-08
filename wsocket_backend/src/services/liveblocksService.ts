import { Liveblocks } from "@liveblocks/node";

import { env } from "../config/env";
import { prisma } from "../prisma/client";
import { HttpError } from "../utils/HttpError";

type LiveblocksAuthInput = {
  liveblocksRoomId: string;
  userId: string;
};

const EDITOR_ROOM_PREFIX = "editor:";
const WHITEBOARD_ROOM_PREFIX = "whiteboard:";
const ALLOWED_ROOM_PREFIXES = [WHITEBOARD_ROOM_PREFIX, EDITOR_ROOM_PREFIX];

let liveblocksClient: Liveblocks | null = null;

const getLiveblocksClient = () => {
  if (!env.liveblocksSecretKey) {
    throw new HttpError(500, "Liveblocks is not configured");
  }

  if (!liveblocksClient) {
    liveblocksClient = new Liveblocks({
      secret: env.liveblocksSecretKey,
    });
  }

  return liveblocksClient;
};

const getAppRoomIdFromLiveblocksRoom = (liveblocksRoomId: string) => {
  const matchingPrefix = ALLOWED_ROOM_PREFIXES.find((prefix) => {
    return liveblocksRoomId.startsWith(prefix);
  });

  if (!matchingPrefix) {
    throw new HttpError(400, "Invalid Liveblocks room");
  }

  const appRoomId = liveblocksRoomId.slice(matchingPrefix.length).trim();

  if (!appRoomId) {
    throw new HttpError(400, "Invalid Liveblocks room");
  }

  return appRoomId;
};

const verifyLiveblocksRoomMembership = async (appRoomId: string, userId: string) => {
  const roomMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        userId,
        roomId: appRoomId,
      },
    },
    select: {
      id: true,
    },
  });

  if (!roomMember) {
    throw new HttpError(403, "You do not have access to this collaboration room");
  }
};

const getLiveblocksUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      email: true,
    },
  });

  if (!user) {
    throw new HttpError(401, "Authenticated user was not found");
  }

  return user;
};

export const authorizeLiveblocksCollaborationRoom = async ({
  liveblocksRoomId,
  userId,
}: LiveblocksAuthInput) => {
  const appRoomId = getAppRoomIdFromLiveblocksRoom(liveblocksRoomId);

  // Liveblocks is used for whiteboard sync and editor Yjs text sync.
  // The real access decision still belongs to our database membership table.
  await verifyLiveblocksRoomMembership(appRoomId, userId);

  const user = await getLiveblocksUser(userId);

  const liveblocks = getLiveblocksClient();
  const session = liveblocks.prepareSession(userId, {
    userInfo: {
      name: user.username,
      email: user.email,
    },
  });

  session.allow(liveblocksRoomId, session.FULL_ACCESS);

  const authResponse = await session.authorize();

  if (authResponse.status >= 400) {
    throw new HttpError(authResponse.status, "Liveblocks authorization failed");
  }

  return JSON.parse(authResponse.body) as { token: string };
};
