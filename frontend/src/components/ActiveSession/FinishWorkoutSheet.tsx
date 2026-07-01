import React, { useState, useEffect, useRef } from "react";
import { X, Trophy, NotepadText } from "lucide-react";
import { WorkoutSessionResponse } from "shared";

interface FinishWorkoutSheetProps {
  isOpen: boolean;
  session: WorkoutSessionResponse | null;
  elapsedMinutes: number;
  onClose: () => void;
  onConfirm: (notes: string) => void;
  isPending: boolean;
}

export const FinishWorkoutSheet: React.FC<FinishWorkoutSheetProps> = ({
  isOpen,
  session,
  elapsedMinutes,
  onClose,
  onConfirm,
  isPending,
}) => {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleBackdropClick = (event: MouseEvent) => {
      if (event.target === dialog) {
        const rect = dialog.getBoundingClientRect();
        const inside =
          rect.top <= event.clientY &&
          event.clientY <= rect.bottom &&
          rect.left <= event.clientX &&
          event.clientX <= rect.right;
        if (!inside) {
          onClose();
        }
      }
    };

    dialog.addEventListener("click", handleBackdropClick);
    return () => {
      dialog.removeEventListener("click", handleBackdropClick);
    };
  }, [onClose]);

  if (!session) return null;

  // Calculate statistics
  const exerciseCount = session.exercises.length;
  const setsCount = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0,
  );

  // Calculate total volume (working sets completed)
  const totalVolume = session.exercises.reduce((acc, ex) => {
    const volume = ex.sets.reduce((sum, s) => {
      if (
        s.status === "completed" &&
        s.type === "working" &&
        s.weight &&
        s.reps
      ) {
        return sum + s.weight * s.reps;
      }
      return sum;
    }, 0);
    return acc + volume;
  }, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(notes);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="m-auto w-[min(100%-2rem,40rem)] max-w-lg rounded-2xl border border-border bg-card p-6 shadow-elevated backdrop:bg-background/60 backdrop:backdrop-blur-sm focus:outline-none max-h-[85vh] overflow-y-auto"
    >
      <div className="mx-auto max-w-lg space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-accent fill-accent/10" />
            Finish Workout 🎉
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-surface border border-border text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-surface/40 p-3.5 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Duration
              </span>
              <span className="font-heading text-xl font-extrabold text-foreground mt-1 block">
                {elapsedMinutes} min
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface/40 p-3.5 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Exercises
              </span>
              <span className="font-heading text-xl font-extrabold text-foreground mt-1 block">
                {exerciseCount}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface/40 p-3.5 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Sets
              </span>
              <span className="font-heading text-xl font-extrabold text-foreground mt-1 block">
                {setsCount}
              </span>
            </div>

            <div className="rounded-xl border border-border bg-surface/40 p-3.5 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                Volume ({session.unit})
              </span>
              <span className="font-heading text-xl font-extrabold text-primary mt-1 block">
                {totalVolume.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Workout Notes */}
          <div className="space-y-2">
            <label
              htmlFor="workout-notes"
              className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5"
            >
              <NotepadText className="h-4 w-4" />
              Workout Notes
            </label>
            <textarea
              id="workout-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did this workout feel? Write any performance notes here..."
              className="block w-full rounded-lg border border-border bg-surface/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex flex-col gap-2 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground transition-all hover:bg-primary-hover disabled:opacity-50"
            >
              {isPending ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-primary-foreground"></div>
              ) : (
                "Finish Workout"
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-surface border border-border py-3 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              Keep Logging
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
};
export default FinishWorkoutSheet;
