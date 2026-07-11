// e.g. "Jul 9" — the short date format used across workout summaries, PR
// lists, and progress charts.
export function formatShortDate(date: string | Date): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return value.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
