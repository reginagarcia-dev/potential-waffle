import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DiscardWorkoutSheetProps {
  isOpen: boolean;
  workoutName?: string;
  onClose: () => void;
  onDiscard: () => void;
  isPending?: boolean;
}

export const DiscardWorkoutSheet: React.FC<DiscardWorkoutSheetProps> = ({
  isOpen,
  workoutName,
  onClose,
  onDiscard,
  isPending = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

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
          <div className="flex gap-3">
            <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
              <AlertTriangle className="size-5" />
            </div>

            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Discard Workout?
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                This will delete{" "}
                <span className="font-semibold text-foreground">
                  {workoutName || "this workout"}
                </span>{" "}
                and all logged sets.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close discard workout"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="space-y-3 px-5 py-5">
        <button
          type="button"
          disabled={isPending}
          onClick={onDiscard}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-xl bg-danger px-4 text-base font-semibold text-white",
            "transition hover:bg-danger/90 active:bg-danger/80",
            "disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          {isPending ? "Discarding..." : "Discard Workout"}
        </button>

        <button
          type="button"
          onClick={onClose}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground",
            "transition hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          Keep Logging
        </button>
      </div>
    </dialog>
  );
};

export default DiscardWorkoutSheet;
