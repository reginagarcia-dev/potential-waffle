import { ChevronDown, MoreHorizontal } from "lucide-react";
import type { ReactNode } from "react";

type ExerciseCardProps = {
  name: string;
  historyLabel?: string;
  expanded?: boolean;
  children?: ReactNode;
};

export function ExerciseCard({
  name,
  historyLabel,
  expanded = true,
  children,
}: ExerciseCardProps) {
  return (
    <section className="rounded-2xl border border-border/80 bg-card p-4 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{name}</h3>

          {historyLabel ? (
            <p className="mt-1 text-xs text-muted-foreground">{historyLabel}</p>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          <button className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
            <MoreHorizontal className="size-4" />
          </button>

          <button className="rounded-md p-1 text-muted-foreground hover:bg-muted/50 hover:text-foreground">
            <ChevronDown
              className={`size-4 transition ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </div>

      {expanded ? <div className="mt-4 space-y-2">{children}</div> : null}
      <button className="mt-2 inline-flex h-10 w-full items-center justify-center rounded-md border border-primary/40 text-sm font-semibold text-primary hover:bg-primary/10">
        + Add Set
      </button>
    </section>
  );
}
