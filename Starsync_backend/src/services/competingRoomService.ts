import { prisma } from "../prisma/client";
import type { CreateRoomInput } from "../validations/roomValidation";

const DEFAULT_COMPETING_PROBLEM_COUNT = 4;

type ProblemForAssignment = {
  id: string;
};

export const getRoomPurpose = (input: CreateRoomInput) => {
  return input.purpose ?? "COLLABORATIVE";
};

export const getCompetingRoomDifficulty = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return null;
  }

  return input.difficulty ?? null;
};

export const getCompetingRoomTopics = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return [];
  }

  return input.topics ?? [];
};

export const getCompetingRoomDuration = (input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return null;
  }

  return input.durationMinutes ?? null;
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

/**
 * Picks problems in decreasing order of preference: the requested difficulty
 * and topics first, then the requested difficulty alone, then any active
 * problem. The widening keeps a competing room from starting empty when the
 * requested filters match too few problems.
 */
const selectProblemsForCompetingRoom = async (input: CreateRoomInput): Promise<ProblemForAssignment[]> => {
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

  return selectedProblems;
};

export const assignProblemsToCompetingRoom = async (roomId: string, input: CreateRoomInput) => {
  if (getRoomPurpose(input) !== "COMPETING") {
    return;
  }

  const selectedProblems = await selectProblemsForCompetingRoom(input);

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
