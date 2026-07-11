import React, { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Sheet } from "@/components/ui/Sheet";
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
    <Sheet
      dialogRef={dialogRef}
      onClose={onClose}
      title="Workout Note"
      subtitle="Capture how the workout felt."
      closeAriaLabel="Close workout note"
    >
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
    </Sheet>
  );
};

export default WorkoutNoteSheet;
