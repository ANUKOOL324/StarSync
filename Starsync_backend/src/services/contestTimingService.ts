type RoomSessionStatus = "WAITING" | "RUNNING" | "ENDED";

/**
 * A contest runs for `durationMinutes` starting from the moment the admin
 * started the session, never from when the room was created.
 */
type ContestWindow = {
  sessionStartedAt: Date | null;
  durationMinutes: number | null;
};

type ContestSession = ContestWindow & {
  sessionStatus: RoomSessionStatus;
};

export const getContestEndTime = (window: ContestWindow): number | null => {
  if (!window.sessionStartedAt || !window.durationMinutes) {
    return null;
  }

  return window.sessionStartedAt.getTime() + window.durationMinutes * 60 * 1000;
};

/**
 * A running contest is treated as ended once its window has elapsed, even if
 * nobody has written the ENDED status to the room yet.
 */
export const isContestEnded = (session: ContestSession): boolean => {
  if (session.sessionStatus === "ENDED") {
    return true;
  }

  if (session.sessionStatus !== "RUNNING") {
    return false;
  }

  const endTime = getContestEndTime(session);

  return endTime !== null && Date.now() >= endTime;
};

export const isSubmissionLate = (window: ContestWindow): boolean => {
  const endTime = getContestEndTime(window);

  return endTime !== null && Date.now() > endTime;
};
