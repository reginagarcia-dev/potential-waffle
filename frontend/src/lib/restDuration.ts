// Formats a rest-duration option's label, e.g. 60 -> "1 minute", 90 -> "1 min 30s".
export function formatRestDurationLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;

  if (remainder === 0) {
    return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  }

  return `${minutes} min${minutes === 1 ? "" : "s"} ${remainder}s`;
}
