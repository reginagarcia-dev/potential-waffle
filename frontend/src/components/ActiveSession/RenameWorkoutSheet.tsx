import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface RenameWorkoutSheetProps {
  isOpen: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
  isPending?: boolean;
}

export const RenameWorkoutSheet: React.FC<RenameWorkoutSheetProps> = ({
  isOpen,
  currentName,
  onClose,
  onSave,
  isPending = false,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName, isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isOpen && dialog.open) {
      dialog.close();
    }
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) return;

    onSave(trimmed);
  };

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
      <form onSubmit={handleSubmit}>
        <div className="px-5 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground">
                Rename Workout
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Give this session a clearer name.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              aria-label="Close rename workout"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-5">
          <label
            htmlFor="workout-name"
            className="text-sm font-semibold text-foreground"
          >
            Workout name
          </label>

          <input
            id="workout-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className={cn(
              "mt-2 h-12 w-full rounded-xl border border-input bg-surface px-3 text-sm font-semibold text-foreground",
              "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
            )}
            autoFocus
          />
        </div>

        <div className="border-t border-border bg-card px-5 py-4">
          <button
            type="submit"
            disabled={isPending || !name.trim()}
            className={cn(
              "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground",
              "transition hover:bg-primary-hover active:bg-primary-pressed",
              "disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring",
            )}
          >
            {isPending ? "Saving..." : "Save Name"}
          </button>
        </div>
      </form>
    </dialog>
  );
};

export default RenameWorkoutSheet;
