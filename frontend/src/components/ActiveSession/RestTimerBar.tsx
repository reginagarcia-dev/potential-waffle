import React from "react";
import { Timer } from "lucide-react";
import { useRestTimer } from "../../context/RestTimerContext.js";

export const RestTimerBar: React.FC = () => {
  const {
    isRunning: isRestTimerRunning,
    timeRemaining,
    nextLabel,
    skipTimer,
    addThirtySeconds,
  } = useRestTimer();

  if (!isRestTimerRunning || timeRemaining <= 0) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-3 shadow-bottomBar">
      <div className="flex items-center gap-3">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Timer className="size-6" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold tabular-nums text-foreground">
            Rest {formatTime(timeRemaining)}
          </p>

          {nextLabel ? (
            <p className="mt-0.5 truncate text-sm text-muted-foreground">
              Next: {nextLabel}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <button
            type="button"
            onClick={skipTimer}
            className="text-sm text-muted-foreground transition hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Skip
          </button>

          <button
            type="button"
            onClick={addThirtySeconds}
            className="text-sm font-semibold text-primary transition hover:text-primary-hover focus:outline-none focus:ring-2 focus:ring-ring"
          >
            +30s
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestTimerBar;
