import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type SetType = "working" | "warmup";
type SetStatus = "pending" | "completed";

type SetRowProps = {
  setNumber: number;
  type?: SetType;
  status?: SetStatus;
  previous?: string;
  weight?: string;
  reps?: string;
  rpe?: string;
  onConfirm?: () => void;
  onClick?: () => void;
};

export function SetRow({
  setNumber,
  type = "working",
  status = "pending",
  weight = "—",
  reps = "—",
  onConfirm,
  onClick,
}: SetRowProps) {
  const isWarmup = type === "warmup";
  const isCompleted = status === "completed";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={cn(
        "group grid min-h-12 grid-cols-[2rem_1fr_3.5rem_3rem_3rem_2rem] items-center gap-2 rounded-xl border px-3 py-2.5 transition-colors",
        isWarmup
          ? "border-border/70 bg-muted/20 text-muted-foreground"
          : "border-border bg-surface/80 hover:border-primary/35 hover:bg-surface",
        !isCompleted &&
          !isWarmup &&
          "border-dashed border-border/80 bg-surface/40 hover:border-primary/40 hover:bg-surface/70",
        isCompleted && !isWarmup && "border-primary/25 bg-primary/5",
      )}
    >
      <span
        className={cn(
          "text-sm font-semibold tabular-nums transition-colors",
          isWarmup
            ? "inline-flex size-7 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground"
            : isCompleted
              ? "text-primary"
              : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {isWarmup ? "W" : setNumber}
      </span>

      {/* <span className="text-sm tabular-nums text-muted-foreground">
    {previous}
  </span> */}

      <span
        className={cn(
          "text-sm font-semibold tabular-nums transition-colors",
          weight && weight !== "—"
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {weight}
      </span>

      <span
        className={cn(
          "text-sm font-semibold tabular-nums transition-colors",
          reps && reps !== "—"
            ? "text-foreground"
            : "text-muted-foreground group-hover:text-foreground",
        )}
      >
        {reps}
      </span>

      {/* <span className="text-sm font-semibold tabular-nums text-foreground">
    {rpe}
  </span> */}

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onConfirm?.();
        }}
        className={cn(
          "ml-auto inline-flex size-8 items-center justify-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
          isCompleted
            ? "bg-primary text-primary-foreground hover:bg-primary-hover"
            : "border-2 border-muted-foreground/35 text-transparent hover:border-primary hover:bg-primary/10",
        )}
      >
        {isCompleted ? <Check className="size-4 stroke-[3]" /> : null}
      </button>
    </div>
  );
}
