// Warmup sets are always labeled "W"; working sets are numbered sequentially,
// ignoring any warmups interspersed between them.
export function getSetLabel(set: { type: string }, workingIndex: number): string {
  return set.type === "warmup" ? "W" : String(workingIndex);
}

export function withSetLabels<T extends { type: string }>(
  sets: T[],
): Array<{ set: T; label: string }> {
  let workingCount = 0;
  return sets.map((set) => {
    if (set.type !== "warmup") workingCount += 1;
    return { set, label: getSetLabel(set, workingCount) };
  });
}
