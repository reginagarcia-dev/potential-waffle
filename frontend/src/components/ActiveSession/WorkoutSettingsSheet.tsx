import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalDialog } from "@/hooks/useModalDialog";

interface WorkoutSettingsSheetProps {
  isOpen: boolean;
  unit: "lbs" | "kg";
  defaultRestSeconds: number;
  onClose: () => void;
  onSave: (settings: {
    unit: "lbs" | "kg";
    defaultRestSeconds: number;
  }) => void;
  isPending?: boolean;
}

const REST_OPTIONS = [
  { label: "1:00", value: 60 },
  { label: "2:00", value: 120 },
  { label: "3:00", value: 180 },
  { label: "5:00", value: 300 },
];

export const WorkoutSettingsSheet: React.FC<WorkoutSettingsSheetProps> = ({
  isOpen,
  unit,
  defaultRestSeconds,
  onClose,
  onSave,
  isPending = false,
}) => {
  const dialogRef = useModalDialog(isOpen);
  const [selectedUnit, setSelectedUnit] = useState<"lbs" | "kg">(unit);
  const [restSeconds, setRestSeconds] = useState(defaultRestSeconds);

  useEffect(() => {
    setSelectedUnit(unit);
    setRestSeconds(defaultRestSeconds);
  }, [unit, defaultRestSeconds, isOpen]);

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "m-auto w-[min(100%-2rem,26rem)] max-w-md rounded-2xl border border-border bg-card p-0 text-foreground shadow-elevated",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "overflow-hidden focus:outline-none",
      )}
    >
      <div className="px-5 pt-4">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-foreground">
              Workout Settings
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Adjust settings for this workout only.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close workout settings"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4 px-5 py-5">
        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-foreground">Unit</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Used for weights in this session.
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {(["lbs", "kg"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setSelectedUnit(option)}
                className={cn(
                  "h-11 rounded-xl border text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-ring",
                  selectedUnit === option
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {option}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h3 className="text-sm font-semibold text-foreground">
            Default rest timer
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Starts after each completed working set.
          </p>

          <div className="mt-4 grid grid-cols-4 gap-2">
            {REST_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setRestSeconds(option.value)}
                className={cn(
                  "h-10 rounded-xl border text-sm font-semibold tabular-nums transition focus:outline-none focus:ring-2 focus:ring-ring",
                  restSeconds === option.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </section>
      </div>

      <div className="border-t border-border bg-card px-5 py-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() =>
            onSave({
              unit: selectedUnit,
              defaultRestSeconds: restSeconds,
            })
          }
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground",
            "transition hover:bg-primary-hover active:bg-primary-pressed",
            "disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          {isPending ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </dialog>
  );
};

export default WorkoutSettingsSheet;
