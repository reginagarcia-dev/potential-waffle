import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { PRBadge } from "./PRBadge";

export type PREntry = {
  id?: string | number;
  exerciseName: string;
  weight: number | null;
  reps: number | null;
  unit?: string;
  date?: string;
};

type PRListCardProps = {
  entries: PREntry[];
  // Today's PR list highlights amounts in the foreground color; History's and
  // WorkoutSummary's are muted — preserves each page's existing look.
  emphasize?: boolean;
  // History's PR list spells out "reps" after the count; Today's doesn't —
  // preserves each page's existing wording.
  showRepsWord?: boolean;
  // e.g. a "Show All" button, rendered after the entries inside the same
  // bordered card (preserves the current layout where it shares the card).
  footer?: ReactNode;
};

export function PRListCard({
  entries,
  emphasize,
  showRepsWord,
  footer,
}: PRListCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {entries.map((pr, idx) => (
        <div
          key={pr.id ?? idx}
          className={cn(
            "flex items-center justify-between",
            idx > 0 && "mt-4 border-t border-border pt-4",
          )}
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              {pr.exerciseName}
            </p>
            <p
              className={cn(
                "text-sm tabular-nums",
                emphasize ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {pr.weight != null
                ? `${pr.weight}${pr.unit ? ` ${pr.unit}` : ""}`
                : "—"}
              {pr.reps
                ? ` × ${pr.reps}${showRepsWord ? " reps" : ""}`
                : ""}
            </p>
            {pr.date && (
              <p className="mt-0.5 text-xs text-muted-foreground">{pr.date}</p>
            )}
          </div>
          <PRBadge />
        </div>
      ))}
      {footer}
    </div>
  );
}
