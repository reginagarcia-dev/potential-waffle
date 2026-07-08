import React from "react";
import { Check, Timer, X } from "lucide-react";
import {
  selectIsRunning,
  useRestTimerStore,
} from "../../stores/restTimerStore.js";

const RING_SIZE = 220;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export const RestTimerBar: React.FC = () => {
  const isRestTimerRunning = useRestTimerStore(selectIsRunning);
  const isComplete = useRestTimerStore((s) => s.isComplete);
  const timeRemaining = useRestTimerStore((s) => s.timeRemaining);
  const nextLabel = useRestTimerStore((s) => s.nextLabel);
  const skipTimer = useRestTimerStore((s) => s.skipTimer);
  const addThirtySeconds = useRestTimerStore((s) => s.addThirtySeconds);
  const dismissComplete = useRestTimerStore((s) => s.dismissComplete);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (isComplete) {
    return (
      <div
        className="fixed inset-0 z-70 flex items-center justify-center bg-black/65 px-4 backdrop-blur-sm"
        onClick={dismissComplete}
      >
        <div
          className="w-full max-w-sm animate-pop-in rounded-3xl border border-primary/30 bg-card p-5 shadow-elevated motion-reduce:animate-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-end">
            <button
              type="button"
              onClick={dismissComplete}
              aria-label="Dismiss rest complete modal"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="size-5" />
            </button>
          </div>

          <div
            className="relative mx-auto my-4"
            style={{ width: RING_SIZE, height: RING_SIZE }}
          >
            <svg
              width={RING_SIZE}
              height={RING_SIZE}
              viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}
              className="block -rotate-90"
              aria-hidden="true"
            >
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                strokeWidth={RING_STROKE}
                className="stroke-primary/15"
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                className="animate-ring-draw stroke-primary motion-reduce:animate-none"
                style={
                  {
                    "--ring-circumference": `${RING_CIRCUMFERENCE}px`,
                  } as React.CSSProperties
                }
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center px-7 text-center">
              <Check className="mb-1.5 size-10 text-primary" />
              <p className="text-xl font-semibold text-foreground">
                Let&apos;s go!
              </p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {nextLabel ? `Next: ${nextLabel}` : "Time for your next set"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={dismissComplete}
            className="mt-15 inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Back to workout
          </button>
        </div>
      </div>
    );
  }

  if (!isRestTimerRunning) return null;

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

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={addThirtySeconds}
            className="text-sm font-semibold text-primary transition hover:text-primary-hover focus:outline-none focus:ring-2 focus:ring-ring"
          >
            +30s
          </button>

          <button
            type="button"
            onClick={skipTimer}
            aria-label="Dismiss rest timer"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestTimerBar;
