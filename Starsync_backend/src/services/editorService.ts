import { env } from "../config/env";
import { prisma } from "../prisma/client";
import { ensureGroupRoom } from "./roomAccessService";
import { HttpError } from "../utils/HttpError";
import type {
  EditorLanguage,
  RunCodeInput,
  UpdateEditorDocumentInput,
} from "../validations/editorValidation";

type RoomAccessResult = {
  id: string;
  type: "GROUP" | "DM";
  members: Array<{
    userId: string;
    status: "ACTIVE" | "REMOVED";
  }>;
};

type PistonRunPayload = {
  language: string;
  version: string;
  files: Array<{
    name: string;
    content: string;
  }>;
  stdin: string;
};

type PistonRunResponse = {
  language?: string;
  version?: string;
  run?: {
    stdout?: string;
    stderr?: string;
    code?: number | null;
    signal?: string | null;
    output?: string;
    message?: string;
    status?: string;
  };
  compile?: {
    stdout?: string;
    stderr?: string;
    code?: number | null;
    signal?: string | null;
    output?: string;
    message?: string;
    status?: string;
  };
  executionTime?: number;
  time?: number;
};

type PistonRuntime = {
  language: string;
  version: string;
  aliases?: string[];
};

const languageRuntimeMap: Record<EditorLanguage, { language: string; fileName: string }> = {
  c: {
    language: "c",
    fileName: "main.c",
  },
  cpp: {
    language: "cpp",
    fileName: "main.cpp",
  },
  javascript: {
    language: "javascript",
    fileName: "main.js",
  },
  typescript: {
    language: "typescript",
    fileName: "main.ts",
  },
  python: {
    language: "python",
    fileName: "main.py",
  },
};

const runtimeVersionCache = new Map<string, string>();

const versionToNumberParts = (version: string): number[] => {
  return version
    .split(".")
    .map((part) => Number.parseInt(part, 10))
    .map((part) => (Number.isFinite(part) ? part : 0));
};

const compareRuntimeVersions = (firstVersion: string, secondVersion: string): number => {
  const firstParts = versionToNumberParts(firstVersion);
  const secondParts = versionToNumberParts(secondVersion);
  const longestLength = Math.max(firstParts.length, secondParts.length);

  for (let index = 0; index < longestLength; index += 1) {
    const firstPart = firstParts[index] ?? 0;
    const secondPart = secondParts[index] ?? 0;

    if (firstPart !== secondPart) {
      return firstPart - secondPart;
    }
  }

  return 0;
};

const runtimeMatchesLanguage = (runtime: PistonRuntime, language: string): boolean => {
  const runtimeAliases = runtime.aliases ?? [];

  return runtime.language === language || runtimeAliases.includes(language);
};

const findLatestRuntimeForLanguage = (
  runtimes: PistonRuntime[],
  language: string,
): PistonRuntime | null => {
  const matchingRuntimes = runtimes.filter((runtime) => runtimeMatchesLanguage(runtime, language));

  if (matchingRuntimes.length === 0) {
    return null;
  }

  const sortedRuntimes = [...matchingRuntimes].sort((firstRuntime, secondRuntime) => {
    return compareRuntimeVersions(secondRuntime.version, firstRuntime.version);
  });

  return sortedRuntimes[0] ?? null;
};

const firstReadableText = (...values: Array<string | undefined>): string => {
  const readableText = values.find((value) => {
    return typeof value === "string" && value.trim().length > 0;
  });

  return readableText ?? "";
};

const prepareCodeForRunner = (language: EditorLanguage, code: string): string => {
  if (language !== "typescript") {
    return code;
  }

  
  
  
  return `declare const require: any;\n${code}`;
};

const resolveRuntimeVersion = async (language: string) => {
  const cachedVersion = runtimeVersionCache.get(language);

  if (cachedVersion) {
    return cachedVersion;
  }

  const response = await fetch(`${env.codeRunnerUrl}/runtimes`);

  if (!response.ok) {
    throw new HttpError(502, "Code runner is currently unavailable");
  }

  const runtimes = (await response.json()) as PistonRuntime[];
  const matchingRuntime = findLatestRuntimeForLanguage(runtimes, language);

  if (!matchingRuntime) {
    throw new HttpError(400, "Unsupported language.");
  }

  runtimeVersionCache.set(language, matchingRuntime.version);

  return matchingRuntime.version;
};

const findRoomForEditorAccess = async (roomId: string, userId: string): Promise<RoomAccessResult> => {
  const room = await prisma.room.findFirst({
    where: {
      OR: [{ id: roomId }, { slug: roomId }],
    },
    select: {
      id: true,
      type: true,
      members: {
        where: { userId },
        select: {
          userId: true,
          status: true,
        },
      },
    },
  });

  if (!room) {
    throw new HttpError(404, "Room not found");
  }

  return room;
};
export const verifyEditorRoomAccess = async (roomId: string, userId: string) => {
  const room = await findRoomForEditorAccess(roomId, userId);
  ensureGroupRoom({ id: room.id, type: room.type, adminId: null });
  const userIsActiveRoomMember = room.members.some((member) => {
    return member.userId === userId && member.status === "ACTIVE";
  });

  if (!userIsActiveRoomMember) {
    throw new HttpError(403, "You do not have access to this room editor");
  }

  return room.id;
};
export const getOrCreateEditorDocument = async (roomId: string, userId: string) => {
  const verifiedRoomId = await verifyEditorRoomAccess(roomId, userId);

  const document = await prisma.codeDocument.upsert({
    where: {
      roomId: verifiedRoomId,
    },
    update: {},
    create: {
      roomId: verifiedRoomId,
      title: "main",
      language: "javascript",
      content: "",
    },
  });

  return document;
};

export const updateEditorDocument = async (
  roomId: string,
  userId: string,
  input: UpdateEditorDocumentInput,
) => {
  const verifiedRoomId = await verifyEditorRoomAccess(roomId, userId);

  const document = await prisma.codeDocument.upsert({
    where: {
      roomId: verifiedRoomId,
    },
    update: {
      content: input.content,
      language: input.language,
    },
    create: {
      roomId: verifiedRoomId,
      title: "main",
      content: input.content,
      language: input.language,
    },
  });

  return document;
};

export const executeCodeWithInput = async (
  language: EditorLanguage,
  code: string,
  stdin: string,
) => {
  const runtime = languageRuntimeMap[language];

  if (!runtime) {
    throw new HttpError(400, "Unsupported language");
  }

  const runtimeVersion = await resolveRuntimeVersion(runtime.language);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 75_000);
  const executionStartedAt = Date.now();

  const runnerPayload: PistonRunPayload = {
    language: runtime.language,
    version: runtimeVersion,
    files: [
      {
        name: runtime.fileName,
        content: prepareCodeForRunner(language, code),
      },
    ],
    stdin,
  };

  try {
    const response = await fetch(`${env.codeRunnerUrl}/execute`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(runnerPayload),
      signal: controller.signal,
    });

    if (!response.ok) {
      const runnerErrorText = await response.text();
      const runnerErrorMessage = firstReadableText(
        runnerErrorText,
        "Code runner is currently unavailable",
      );

      throw new HttpError(502, runnerErrorMessage);
    }

    const result = (await response.json()) as PistonRunResponse;
    const exitCode = result.run?.code ?? null;
    const measuredExecutionTimeMs = Date.now() - executionStartedAt;
    const compileFailed = Boolean(result.compile?.signal || result.compile?.status === "TO");
    const runFailed = Boolean(result.run?.signal || result.run?.status === "TO");
    const processExitedWithError = typeof exitCode === "number" && exitCode !== 0;
    const executionFailed = compileFailed || runFailed || processExitedWithError;
    const compileOutput = firstReadableText(
      result.compile?.output,
      result.compile?.stderr,
      result.compile?.message,
    );
    const runtimeOutput = firstReadableText(result.run?.output, result.run?.message);

    return {
      language: result.language ?? runtime.language,
      version: result.version ?? runtimeVersion,
      stdout: result.run?.stdout ?? "",
      stderr: result.run?.stderr ?? "",
      compileOutput,
      output: runtimeOutput,
      exitCode,
      signal: result.run?.signal ?? null,
      executionTimeMs: result.executionTime ?? result.time ?? measuredExecutionTimeMs,
      status: executionFailed ? "error" : "success",
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    const requestTimedOut = error instanceof Error && error.name === "AbortError";

    if (requestTimedOut) {
      throw new HttpError(504, "Code runner timed out");
    }

    throw new HttpError(502, "Code runner is unavailable");
  } finally {
    clearTimeout(timeoutId);
  }
};

export const runCode = async (input: RunCodeInput, userId: string) => {
  await verifyEditorRoomAccess(input.roomId, userId);

  return executeCodeWithInput(input.language, input.code, input.stdin);
};