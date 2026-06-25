import { Pause } from "lucide-react";

type RestTimerBarProps = {
  timeRemaining: string;
  nextLabel: string;
  onSkip?: () => void;
  onAddThirty?: () => void;
};

export function RestTimerBar({
  timeRemaining,
  nextLabel,
  onSkip,
  onAddThirty,
}: RestTimerBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-16 z-40 mx-auto w-full max-w-md px-4">
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3 shadow-bottomBar">
        <div className="flex size-10 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Pause className="size-4" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold tabular-nums text-foreground">
            Rest {timeRemaining}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            Next: {nextLabel}
          </p>
        </div>

        <button
          type="button"
          onClick={onSkip}
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Skip
        </button>

        <button
          type="button"
          onClick={onAddThirty}
          className="text-sm font-semibold text-primary"
        >
          +30s
        </button>
      </div>
    </div>
  );
}
