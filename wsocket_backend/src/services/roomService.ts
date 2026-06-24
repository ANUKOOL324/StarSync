import { prisma } from "../prisma/client";
import { executeCodeWithInput } from "./editorService";
import { HttpError } from "../utils/HttpError";
import type { CreateRoomInput, JoinRoomInput, RunRoomProblemCodeInput, UpdateRoomInput } from "../validations/roomValidation";
import {
  ensureActiveRoomAdmin,
  ensureActiveRoomMember,
  ensureGroupRoom,
  findRoomForAccess,
  getActiveRoomMember,
} from "./roomAccessService";

const JOIN_CODE_PREFIX = "RM";
const JOIN_CODE_CHARACTERS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_COMPETING_PROBLEM_COUNT = 4;

const createSlug = (roomName: string): string => {
  const lowercaseName = roomName.toLowerCase().trim();
  const hyphenatedName = lowercaseName.replace(/[^a-z0-9]+/g, "-");
  const cleanSlug = hyphenatedName.replace(/(^-|-$)/g, "");

  return cleanSlug;
};

const normalizeJoinCode = (joinCode: string): string => {
  return joinCode.trim().toUpperCase();
};

const createReadableJoinCode = (): string => {
  let code = "";

  for (let index = 0; index < 5; index += 1) {
    const randomIndex = Math.floor(Math.random() * JOIN_CODE_CHARACTERS.length);
    code += JOIN_CODE_CHARACTERS[randomIndex];
  }

  return `${JOIN_CODE_PREFIX}-${code}`;
};

const generateUniqueJoinCode = async (): Promise<string> => {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const joinCode = createReadableJoinCode();
    const existingRoom = await prisma.room.findUnique({
      where: { joinCode },
      select: { id: true },
    });

    if (!existingRoom) {
      return joinCode;
    }
  }

  throw new HttpError(500, "Could not generate room code");
};

const roomSelect = {
  id: true,
  name: true,
  slug: true,
  joinCode: true,
  maxMembers: true,
  type: true,
  purpose: true,
  difficulty: true,
  topics: true,
  durationMinutes: true,
  createdAt: true,
  adminId: true,
  admin: {
    select: {
      id: true,
      username: true,
      email: true,
    },
  },
  _count: {
    select: {
      members: {
        where: { status: "ACTIVE" },
      },
      messages: true,
    },
  },
} as const;

const ensureSlugIsAvailable = async (slug: string, currentRoomId?: string) => {
  const existingRoom = await prisma.room.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingRoom && existingRoom.id !== currentRoomId) {
    throw new HttpError(409, "Room slug is already taken");
  }
};


const createUniqueSlugForRoomName = async (roomName: string): Promise<string> => {
  const baseSlug = createSlug(roomName);

  if (!baseSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  let candidateSlug = baseSlug;

  for (let attemptNumber = 1; attemptNumber <= 25; attemptNumber += 1) {
    const existingRoom = await prisma.room.findUnique({
      where: { slug: candidateSlug },
      select: { id: true },
    });

    if (!existingRoom) {
      return candidateSlug;
    }

    candidateSlug = `${baseSlug}-${attemptNumber + 1}`;
  }

  throw new HttpError(500, "Could not create a unique room slug");
};

const findExistingRoomMember = async (roomId: string, userId: string) => {
  const roomMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        roomId,
        userId,
      },
    },
    select: {
      id: true,
      status: true,
    },
  });

  return roomMember;
};

const getSafeMaxMembers = (input: CreateRoomInput): number | null => {
  if (input.unlimitedMembers) {
    return null;
  }

  return input.maxMembers ?? null;
};

const getRoomPurpose = (input: CreateRoomInput) => {
  return input.purpose ?? "COLLABORATIVE";
};

const getCompetingRoomDifficulty = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return null;
  }

  return input.difficulty ?? null;
};

const getCompetingRoomTopics = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return [];
  }

  return input.topics ?? [];
};

const getCompetingRoomDuration = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return null;
  }

  return input.durationMinutes ?? null;
};

type ProblemForAssignment = {
  id: string;
};

const addUniqueProblems = (
  selectedProblems: ProblemForAssignment[],
  candidateProblems: ProblemForAssignment[],
  selectedProblemIds: Set<string>,
  problemCount: number,
) => {
  for (const problem of candidateProblems) {
    if (selectedProblems.length >= problemCount) {
      return;
    }

    if (selectedProblemIds.has(problem.id)) {
      continue;
    }

    selectedProblems.push(problem);
    selectedProblemIds.add(problem.id);
  }
};

const assignProblemsToCompetingRoom = async (roomId: string, input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return;
  }

  const problemCount = input.problemCount ?? DEFAULT_COMPETING_PROBLEM_COUNT;
  const difficulty = getCompetingRoomDifficulty(input);
  const topics = getCompetingRoomTopics(input);
  const selectedProblems: ProblemForAssignment[] = [];
  const selectedProblemIds = new Set<string>();

  if (difficulty && topics.length > 0) {
    const matchingTopicProblems = await prisma.problem.findMany({
      where: {
        isActive: true,
        difficulty,
        topics: { hasSome: topics },
      },
      orderBy: { createdAt: "asc" },
      take: problemCount,
      select: { id: true },
    });

    addUniqueProblems(selectedProblems, matchingTopicProblems, selectedProblemIds, problemCount);
  }

  if (difficulty && selectedProblems.length < problemCount) {
    const sameDifficultyProblems = await prisma.problem.findMany({
      where: {
        isActive: true,
        difficulty,
        id: { notIn: Array.from(selectedProblemIds) },
      },
      orderBy: { createdAt: "asc" },
      take: problemCount - selectedProblems.length,
      select: { id: true },
    });

    addUniqueProblems(selectedProblems, sameDifficultyProblems, selectedProblemIds, problemCount);
  }

  if (selectedProblems.length < problemCount) {
    const fallbackProblems = await prisma.problem.findMany({
      where: {
        isActive: true,
        id: { notIn: Array.from(selectedProblemIds) },
      },
      orderBy: { createdAt: "asc" },
      take: problemCount - selectedProblems.length,
      select: { id: true },
    });

    addUniqueProblems(selectedProblems, fallbackProblems, selectedProblemIds, problemCount);
  }

  if (selectedProblems.length === 0) {
    return;
  }

  await prisma.roomProblem.createMany({
    data: selectedProblems.map((problem, index) => ({
      roomId,
      problemId: problem.id,
      order: index + 1,
    })),
    skipDuplicates: true,
  });
};

const countActiveRoomMembers = async (roomId: string): Promise<number> => {
  return prisma.roomMember.count({
    where: {
      roomId,
      status: "ACTIVE",
    },
  });
};

const getRequestedMaxMembers = (input: UpdateRoomInput): number | null | undefined => {
  if (input.unlimitedMembers) {
    return null;
  }

  return input.maxMembers;
};

export const createRoom = async (input: CreateRoomInput, adminId: string) => {
  const roomSlug = input.slug ?? (await createUniqueSlugForRoomName(input.name));

  if (!roomSlug) {
    throw new HttpError(400, "Room slug is invalid");
  }

  if (input.slug) {
    await ensureSlugIsAvailable(roomSlug);
  }

  const joinCode = await generateUniqueJoinCode();
  const maxMembers = getSafeMaxMembers(input);
  const roomPurpose = getRoomPurpose(input);

  const createdRoom = await prisma.room.create({
    data: {
      name: input.name,
      slug: roomSlug,
      joinCode,
      maxMembers,
      type: "GROUP",
      purpose: roomPurpose,
      difficulty: getCompetingRoomDifficulty(input),
      topics: getCompetingRoomTopics(input),
      durationMinutes: getCompetingRoomDuration(input),
      adminId,
      members: {
        create: {
          userId: adminId,
          role: "ADMIN",
          status: "ACTIVE",
        },
      },
    },
    select: roomSelect,
  });

  await assignProblemsToCompetingRoom(createdRoom.id, input);

  return createdRoom;
};

export const getRooms = async (userId: string) => {
  const rooms = await prisma.room.findMany({
    where: {
      type: "GROUP",
      members: {
        some: {
          userId,
          status: "ACTIVE",
        },
      },
    },
    orderBy: { createdAt: "desc" },
    select: roomSelect,
  });

  return rooms;
};

export const joinRoomByCode = async (input: JoinRoomInput, userId: string) => {
  const joinCode = normalizeJoinCode(input.joinCode);
  const room = await prisma.room.findUnique({
    where: { joinCode },
    select: roomSelect,
  });

  if (!room || room.type !== "GROUP") {
    throw new HttpError(404, "Invalid room code.", { code: "INVALID_ROOM_CODE" });
  }

  const existingRoomMember = await findExistingRoomMember(room.id, userId);

  if (existingRoomMember?.status === "REMOVED") {
    throw new HttpError(403, "You were removed from this room and cannot rejoin.", {
      code: "ROOM_ACCESS_REMOVED",
    });
  }

  if (existingRoomMember?.status === "ACTIVE") {
    return room;
  }

  const activeMemberCount = room._count.members;

  if (room.maxMembers !== null && activeMemberCount >= room.maxMembers) {
    throw new HttpError(409, "This room is full.", { code: "ROOM_FULL" });
  }

  await prisma.roomMember.create({
    data: {
      roomId: room.id,
      userId,
      role: "MEMBER",
      status: "ACTIVE",
    },
  });

  const joinedRoom = await prisma.room.findUnique({
    where: { id: room.id },
    select: roomSelect,
  });

  if (!joinedRoom) {
    throw new HttpError(404, "Room not found");
  }

  return joinedRoom;
};

export const getRoomByIdOrSlug = async (roomId: string, userId: string) => {
  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: roomId }, { slug: roomId }],
    },
    select: {
      ...roomSelect,
      members: {
        where: { status: "ACTIVE" },
        select: {
          userId: true,
          role: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
      },
    },
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  const currentUserIsActiveMember = room.members.some((member) => member.userId === userId);

  if (!currentUserIsActiveMember) {
    throw new HttpError(403, "You do not have access to this room", { code: "ROOM_ACCESS_DENIED" });
  }

  const otherMember = room.members.find((member) => member.userId !== userId);
  const { members: _members, ...safeRoom } = room;

  if (safeRoom.type === "DM") {
    return {
      ...safeRoom,
      otherUser: otherMember?.user ?? null,
    };
  }

  return safeRoom;
};


export const getRoomProblems = async (roomId: string, userId: string) => {
  const { room } = await ensureActiveRoomMember(roomId, userId);

  const assignedProblems = await prisma.roomProblem.findMany({
    where: { roomId: room.id },
    orderBy: { order: "asc" },
    select: {
      id: true,
      order: true,
      points: true,
      problem: {
        select: {
          id: true,
          slug: true,
          title: true,
          difficulty: true,
          topics: true,
          description: true,
          inputFormat: true,
          outputFormat: true,
          constraints: true,
          examples: true,
          starterCode: true,
          editorial: true,
          testCases: {
            where: { isHidden: false },
            orderBy: { order: "asc" },
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              order: true,
            },
          },
        },
      },
    },
  });

  return assignedProblems.map((roomProblem) => ({
    roomProblemId: roomProblem.id,
    id: roomProblem.problem.id,
    slug: roomProblem.problem.slug,
    order: roomProblem.order,
    shortLabel: `P${roomProblem.order}`,
    points: roomProblem.points,
    title: roomProblem.problem.title,
    difficulty: roomProblem.problem.difficulty,
    topics: roomProblem.problem.topics,
    description: roomProblem.problem.description,
    inputFormat: roomProblem.problem.inputFormat,
    outputFormat: roomProblem.problem.outputFormat,
    constraints: roomProblem.problem.constraints,
    examples: roomProblem.problem.examples,
    starterCode: roomProblem.problem.starterCode,
    editorial: roomProblem.problem.editorial,
    visibleTestCases: roomProblem.problem.testCases,
  }));
};
const normalizeOutputForComparison = (value: string): string => {
  return value.replace(/\r\n/g, "\n").trim();
};

const getRunErrorMessage = (result: Awaited<ReturnType<typeof executeCodeWithInput>>): string | undefined => {
  if (result.status === "success") {
    return undefined;
  }

  const readableError = [result.compileOutput, result.stderr, result.output]
    .find((value) => value.trim().length > 0);

  return readableError || "Code execution failed";
};

export const runRoomProblemVisibleTestcases = async (
  input: RunRoomProblemCodeInput,
  userId: string,
) => {
  const { room } = await ensureActiveRoomMember(input.roomId, userId);

  const roomProblem = await prisma.roomProblem.findFirst({
    where: {
      roomId: room.id,
      problemId: input.problemId,
    },
    select: {
      problem: {
        select: {
          id: true,
          testCases: {
            where: { isHidden: false },
            orderBy: { order: "asc" },
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              order: true,
            },
          },
        },
      },
    },
  });

  if (!roomProblem) {
    throw new HttpError(404, "Problem is not assigned to this room");
  }

  const results = [];

  for (const testCase of roomProblem.problem.testCases) {
    const runResult = await executeCodeWithInput(input.language, input.code, testCase.input);
    const actualOutput = runResult.stdout || runResult.output;
    const passed =
      runResult.status === "success" &&
      normalizeOutputForComparison(actualOutput) === normalizeOutputForComparison(testCase.expectedOutput);

    results.push({
      testcaseId: testCase.id,
      order: testCase.order,
      input: testCase.input,
      expectedOutput: testCase.expectedOutput,
      actualOutput,
      passed,
      error: getRunErrorMessage(runResult),
    });
  }

  const passedCount = results.filter((result) => result.passed).length;

  return {
    problemId: roomProblem.problem.id,
    language: input.language,
    passedCount,
    totalCount: results.length,
    results,
  };
};
export const addGroupRoomMember = async (roomId: string, userId: string) => {
  const room = await findRoomForAccess(roomId);

  if (room.type !== "GROUP") {
    return;
  }

  const activeRoomMember = await getActiveRoomMember(room.id, userId);

  if (!activeRoomMember) {
    throw new HttpError(403, "Join this room with a room code before opening chat");
  }
};

export const getRoomMembers = async (roomId: string, userId: string) => {
  const room = await findRoomForAccess(roomId);
  const currentUserMember = await getActiveRoomMember(room.id, userId);

  if (!currentUserMember) {
    throw new HttpError(403, "You do not have access to this room");
  }

  const members = await prisma.roomMember.findMany({
    where: {
      roomId: room.id,
      status: "ACTIVE",
    },
    orderBy: {
      joinedAt: "asc",
    },
    select: {
      role: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          email: true,
        },
      },
    },
  });

  return members.map((member) => ({
    id: member.user.id,
    username: member.user.username,
    email: member.user.email,
    role: member.role,
    joinedAt: member.joinedAt,
  }));
};

export const updateRoom = async (roomId: string, input: UpdateRoomInput, userId: string) => {
  const { room } = await ensureActiveRoomAdmin(roomId, userId);
  const updateData: {
    name?: string;
    slug?: string;
    maxMembers?: number | null;
  } = {};

  if (input.name) {
    const nextRoomSlug = createSlug(input.name);

    if (!nextRoomSlug) {
      throw new HttpError(400, "Room name is invalid");
    }

    await ensureSlugIsAvailable(nextRoomSlug, room.id);

    updateData.name = input.name;
    updateData.slug = nextRoomSlug;
  }

  const requestedMaxMembers = getRequestedMaxMembers(input);

  if (requestedMaxMembers !== undefined) {
    if (requestedMaxMembers !== null) {
      const activeMemberCount = await countActiveRoomMembers(room.id);

      if (requestedMaxMembers < activeMemberCount) {
        throw new HttpError(409, "Member limit cannot be lower than current active members");
      }
    }

    updateData.maxMembers = requestedMaxMembers;
  }

  if (Object.keys(updateData).length === 0) {
    const currentRoom = await prisma.room.findUnique({
      where: { id: room.id },
      select: roomSelect,
    });

    if (!currentRoom) {
      throw new HttpError(404, "Room not found");
    }

    return currentRoom;
  }

  const updatedRoom = await prisma.room.update({
    where: { id: room.id },
    data: updateData,
    select: roomSelect,
  });

  return updatedRoom;
};

export const deleteRoom = async (roomId: string, userId: string) => {
  const { room } = await ensureActiveRoomAdmin(roomId, userId);

  await prisma.room.delete({
    where: { id: room.id },
  });

  return { id: room.id };
};

export const removeRoomMember = async (roomId: string, targetUserId: string, adminUserId: string) => {
  const { room } = await ensureActiveRoomAdmin(roomId, adminUserId);
  ensureGroupRoom(room);

  if (targetUserId === adminUserId) {
    throw new HttpError(400, "Admins cannot remove themselves");
  }

  const targetRoomMember = await prisma.roomMember.findUnique({
    where: {
      userId_roomId: {
        roomId: room.id,
        userId: targetUserId,
      },
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!targetRoomMember || targetRoomMember.status !== "ACTIVE") {
    throw new HttpError(404, "Active room member not found");
  }

  if (targetRoomMember.role === "ADMIN") {
    throw new HttpError(400, "Admins cannot remove another admin");
  }

  await prisma.roomMember.update({
    where: { id: targetRoomMember.id },
    data: { status: "REMOVED" },
  });

  return { roomId: room.id, userId: targetUserId };
};
