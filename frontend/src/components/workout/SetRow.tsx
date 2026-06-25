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
  previous = "—",
  weight = "—",
  reps = "—",
  rpe = "—",
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
        "grid min-h-11 grid-cols-[2rem_1fr_3.5rem_3rem_3rem_2rem] items-center gap-2 rounded-lg border px-3 py-2",
        isWarmup
          ? "border-border/70 bg-muted/20 text-muted-foreground"
          : "border-border bg-surface",
        !isCompleted && !isWarmup && "border-dashed bg-transparent",
      )}
    >
      <span
        className={cn(
          "text-sm font-medium tabular-nums",
          isWarmup
            ? "inline-flex size-6 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground"
            : "text-muted-foreground",
        )}
      >
        {isWarmup ? "W" : setNumber}
      </span>

      <span className="text-sm tabular-nums text-muted-foreground">
        {previous}
      </span>

      <span className="text-sm font-semibold tabular-nums text-foreground">
        {weight}
      </span>

      <span className="text-sm font-semibold tabular-nums text-foreground">
        {reps}
      </span>

      <span className="text-sm font-semibold tabular-nums text-foreground">
        {rpe}
      </span>

      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onConfirm?.();
        }}
        className={cn(
          "ml-auto inline-flex size-7 items-center justify-center rounded-full border",
          isCompleted
            ? "border-primary bg-primary/10 text-primary"
            : "border-border text-muted-foreground",
        )}
      >
        {isCompleted ? <Check className="size-4" /> : null}
      </button>
    </div>
  );
}
