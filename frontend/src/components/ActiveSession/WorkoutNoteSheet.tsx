import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useModalDialog } from "@/hooks/useModalDialog";

interface WorkoutNoteSheetProps {
  isOpen: boolean;
  currentNote?: string | null;
  onClose: () => void;
  onSave: (note: string) => void;
  isPending?: boolean;
}

export const WorkoutNoteSheet: React.FC<WorkoutNoteSheetProps> = ({
  isOpen,
  currentNote,
  onClose,
  onSave,
  isPending = false,
}) => {
  const dialogRef = useModalDialog(isOpen);
  const [note, setNote] = useState(currentNote ?? "");

  useEffect(() => {
    setNote(currentNote ?? "");
  }, [currentNote, isOpen]);

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
              Workout Note
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Capture how the workout felt.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close workout note"
          >
            <X className="size-5" />
          </button>
        </div>
      </div>

      <div className="px-5 py-5">
        <label
          htmlFor="workout-note"
          className="text-sm font-semibold text-foreground"
        >
          Notes
        </label>

        <textarea
          id="workout-note"
          rows={5}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="How did this workout feel? Any pain, fatigue, form notes, or performance context?"
          className={cn(
            "mt-2 block w-full resize-none rounded-xl border border-input bg-surface px-3 py-3 text-sm leading-6 text-foreground",
            "placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        />
      </div>

      <div className="border-t border-border bg-card px-5 py-4">
        <button
          type="button"
          disabled={isPending}
          onClick={() => onSave(note)}
          className={cn(
            "inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-4 text-base font-semibold text-primary-foreground",
            "transition hover:bg-primary-hover active:bg-primary-pressed",
            "disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring",
          )}
        >
          {isPending ? "Saving..." : "Save Note"}
        </button>
      </div>
    </dialog>
  );
};

export default WorkoutNoteSheet;
