// Whole minutes between a session's start and completion, rounded and
// floored to at least 1 so a sub-minute workout doesn't show as "0 min".
// Returns null while the session hasn't been completed yet.
export function getSessionDurationMinutes(session: {
  startedAt: string;
  completedAt: string | null;
}): number | null {
  if (!session.completedAt) return null;

  return Math.max(
    1,
    Math.round(
      (new Date(session.completedAt).getTime() -
        new Date(session.startedAt).getTime()) /
        60000,
    ),
  );
}
