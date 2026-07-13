import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { ProductButton } from "@/components/ui/ProductButton";

type FinishWorkoutSheetProps = {
  isOpen: boolean;
  elapsedMinutes: number;
  exercises: number;
  sets: number;
  currentNote?: string;
  isPending?: boolean;
  onClose: () => void;
  onFinish: (notes: string) => void;
};

export function FinishWorkoutSheet({
  isOpen,
  elapsedMinutes,
  exercises,
  sets,
  currentNote,
  isPending = false,
  onClose,
  onFinish,
}: FinishWorkoutSheetProps) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNotes(currentNote ?? "");
    } else {
      setNotes("");
    }
  }, [isOpen, currentNote]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="mx-auto w-full max-w-md max-h-[85dvh] overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-elevated">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Finish Workout
          </h2>

          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-3 rounded-xl border border-border bg-surface p-4">
          <SummaryRow label="Duration" value={`${elapsedMinutes} min`} />
          <SummaryRow label="Exercises" value={String(exercises)} />
          <SummaryRow label="Sets" value={String(sets)} />
        </div>

        <div className="mt-4">
          <label
            htmlFor="workout-notes"
            className="mb-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground"
          >
            Workout Notes (optional)
          </label>
          <textarea
            id="workout-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="How did the session feel?"
            rows={3}
            className="w-full resize-none rounded-xl border border-input bg-surface px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <ProductButton
          fullWidth
          className="mt-5"
          disabled={isPending}
          onClick={() => onFinish(notes)}
        >
          {isPending ? "Finishing..." : "Finish Workout"}
        </ProductButton>

        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="mt-3 h-11 w-full text-sm font-semibold text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50"
        >
          Keep Logging
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">
        {value}
      </span>
    </div>
  );
}
