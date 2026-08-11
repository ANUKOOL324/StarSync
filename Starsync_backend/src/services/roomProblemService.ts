import { prisma } from "../prisma/client";
import { HttpError } from "../utils/HttpError";
import type { RunRoomProblemCodeInput, SubmitRoomProblemCodeInput } from "../validations/roomValidation";
import { isContestEnded, isSubmissionLate } from "./contestTimingService";
import { executeCodeWithInput } from "./editorService";
import { ensureActiveRoomMember } from "./roomAccessService";

type SubmissionStatus =
  | "ACCEPTED"
  | "WRONG_ANSWER"
  | "COMPILATION_ERROR"
  | "RUNTIME_ERROR"
  | "TIME_LIMIT_EXCEEDED"
  | "INTERNAL_ERROR";

type CodeExecutionResult = Awaited<ReturnType<typeof executeCodeWithInput>>;

const visibleTestCaseSelect = {
  where: { isHidden: false },
  orderBy: { order: "asc" as const },
  select: {
    id: true,
    input: true,
    expectedOutput: true,
    order: true,
  },
} as const;

const normalizeOutputForComparison = (value: string): string => {
  return value.replace(/\r\n/g, "\n").trim();
};

const getRunErrorMessage = (result: CodeExecutionResult): string | undefined => {
  if (result.status === "success") {
    return undefined;
  }

  const readableError = [result.compileOutput, result.stderr, result.output]
    .find((value) => value.trim().length > 0);

  return readableError || "Code execution failed";
};

const getTestcaseStatus = (runResult: CodeExecutionResult, expectedOutput: string): SubmissionStatus => {
  if (runResult.status === "error") {
    return runResult.compileOutput.trim() !== "" ? "COMPILATION_ERROR" : "RUNTIME_ERROR";
  }

  const actualOutput = runResult.stdout || runResult.output;
  const passed = normalizeOutputForComparison(actualOutput) === normalizeOutputForComparison(expectedOutput);

  return passed ? "ACCEPTED" : "WRONG_ANSWER";
};

/**
 * A submission reports its worst testcase result, ranked from most to least
 * severe: compilation, internal, time limit, runtime, wrong answer.
 */
const mergeOverallStatus = (
  overallStatus: SubmissionStatus,
  testcaseStatus: SubmissionStatus,
): SubmissionStatus => {
  if (testcaseStatus === "COMPILATION_ERROR") {
    return "COMPILATION_ERROR";
  }

  if (testcaseStatus === "INTERNAL_ERROR" && overallStatus !== "COMPILATION_ERROR") {
    return "INTERNAL_ERROR";
  }

  if (
    testcaseStatus === "TIME_LIMIT_EXCEEDED" &&
    !["COMPILATION_ERROR", "INTERNAL_ERROR"].includes(overallStatus)
  ) {
    return "TIME_LIMIT_EXCEEDED";
  }

  if (
    testcaseStatus === "RUNTIME_ERROR" &&
    !["COMPILATION_ERROR", "INTERNAL_ERROR", "TIME_LIMIT_EXCEEDED"].includes(overallStatus)
  ) {
    return "RUNTIME_ERROR";
  }

  if (testcaseStatus === "WRONG_ANSWER" && overallStatus === "ACCEPTED") {
    return "WRONG_ANSWER";
  }

  return overallStatus;
};

const findRoomProblemWithVisibleTestCases = async (roomId: string, problemId: string) => {
  const roomProblem = await prisma.roomProblem.findFirst({
    where: {
      roomId,
      problemId,
    },
    select: {
      problem: {
        select: {
          id: true,
          testCases: visibleTestCaseSelect,
        },
      },
    },
  });

  if (!roomProblem) {
    throw new HttpError(404, "Problem is not assigned to this room");
  }

  return roomProblem;
};

const findRoomProblemWithAllTestCases = async (roomId: string, problemId: string) => {
  const roomProblem = await prisma.roomProblem.findFirst({
    where: {
      roomId,
      problemId,
    },
    select: {
      problem: {
        select: {
          id: true,
          testCases: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              input: true,
              expectedOutput: true,
              isHidden: true,
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

  return roomProblem;
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
          testCases: visibleTestCaseSelect,
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

export const runRoomProblemVisibleTestcases = async (
  input: RunRoomProblemCodeInput,
  userId: string,
) => {
  const { room } = await ensureActiveRoomMember(input.roomId, userId);
  const roomProblem = await findRoomProblemWithVisibleTestCases(room.id, input.problemId);

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

export const submitRoomProblemCode = async (
  input: SubmitRoomProblemCodeInput,
  userId: string,
) => {
  const { room } = await ensureActiveRoomMember(input.roomId, userId);
  const roomProblem = await findRoomProblemWithAllTestCases(room.id, input.problemId);

  const roomDetails = await prisma.room.findUnique({
    where: { id: room.id },
    select: {
      sessionStartedAt: true,
      durationMinutes: true,
    },
  });

  const isLate = roomDetails ? isSubmissionLate(roomDetails) : false;

  let overallStatus: SubmissionStatus = "ACCEPTED";
  let maxExecutionTimeMs = 0;
  const results = [];

  for (const testCase of roomProblem.problem.testCases) {
    const runResult = await executeCodeWithInput(input.language, input.code, testCase.input);
    const actualOutput = runResult.stdout || runResult.output;

    if (runResult.executionTimeMs > maxExecutionTimeMs) {
      maxExecutionTimeMs = runResult.executionTimeMs;
    }

    const testcaseStatus = getTestcaseStatus(runResult, testCase.expectedOutput);
    const error = getRunErrorMessage(runResult);

    overallStatus = mergeOverallStatus(overallStatus, testcaseStatus);

    // Hidden testcases only ever reveal whether they passed.
    if (testCase.isHidden) {
      results.push({
        testcaseId: testCase.id,
        order: testCase.order,
        isHidden: true,
        passed: testcaseStatus === "ACCEPTED",
      });
    } else {
      results.push({
        testcaseId: testCase.id,
        order: testCase.order,
        isHidden: false,
        passed: testcaseStatus === "ACCEPTED",
        input: testCase.input,
        expectedOutput: testCase.expectedOutput,
        actualOutput,
        error,
      });
    }

    if (testcaseStatus === "COMPILATION_ERROR") {
      break;
    }
  }

  const passedCount = results.filter((r) => r.passed).length;

  const submission = await prisma.submission.create({
    data: {
      roomId: room.id,
      problemId: roomProblem.problem.id,
      userId: userId,
      code: input.code,
      language: input.language,
      status: overallStatus,
      runtimeMs: maxExecutionTimeMs,
      memoryKb: null,
      passedCount,
      totalCount: roomProblem.problem.testCases.length,
      isLate,
    },
    include: {
      user: {
        select: {
          username: true,
        },
      },
    },
  });

  return {
    submissionId: submission.id,
    problemId: roomProblem.problem.id,
    language: input.language,
    status: overallStatus,
    passedCount,
    totalCount: roomProblem.problem.testCases.length,
    runtimeMs: maxExecutionTimeMs,
    memoryKb: undefined,
    isLate,
    submittedAt: submission.submittedAt,
    username: submission.user.username,
    results,
  };
};

export const getRoomProblemSubmissions = async (
  roomId: string,
  problemId: string,
  userId: string,
) => {
  const { room } = await ensureActiveRoomMember(roomId, userId);

  const roomDetails = await prisma.room.findUnique({
    where: { id: room.id },
    select: { sessionStatus: true, sessionStartedAt: true, durationMinutes: true },
  });

  const contestHasEnded = roomDetails ? isContestEnded(roomDetails) : false;

  const submissions = await prisma.submission.findMany({
    where: {
      roomId: room.id,
      problemId: problemId,
    },
    orderBy: {
      submittedAt: "desc",
    },
    select: {
      id: true,
      problemId: true,
      code: true,
      language: true,
      status: true,
      runtimeMs: true,
      memoryKb: true,
      passedCount: true,
      totalCount: true,
      isLate: true,
      submittedAt: true,
      userId: true,
      user: {
        select: {
          username: true,
        },
      },
      problem: {
        select: {
          title: true,
        },
      },
    },
  });

  return submissions.map((sub) => {
    // Other people's code stays hidden until the contest is over.
    const canViewCode = sub.userId === userId || contestHasEnded;

    return {
      id: sub.id,
      problemId: sub.problemId,
      problemLabel: sub.problem.title,
      userId: sub.userId,
      username: sub.user.username,
      code: canViewCode ? sub.code : null,
      language: sub.language,
      status: sub.status,
      runtimeMs: sub.runtimeMs ?? undefined,
      memoryKb: sub.memoryKb ?? undefined,
      passedCount: sub.passedCount ?? 0,
      totalCount: sub.totalCount ?? 0,
      isLate: sub.isLate,
      submittedAt: sub.submittedAt.toISOString(),
      canViewCode,
    };
  });
};
