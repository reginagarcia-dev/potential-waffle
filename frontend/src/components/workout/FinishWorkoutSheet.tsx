import { X } from "lucide-react";
import { ProductButton } from "@/components/ui/ProductButton";

type FinishWorkoutSheetProps = {
  isOpen: boolean;
  elapsedMinutes: number;
  exercises: number;
  sets: number;
  volume: string;
  onClose: () => void;
  onFinish: (notes: string) => void;
};

export function FinishWorkoutSheet({
  isOpen,
  elapsedMinutes,
  exercises,
  sets,
  volume,
  onClose,
  onFinish,
}: FinishWorkoutSheetProps) {
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
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <p className="mt-4 text-sm text-muted-foreground">
          Are you sure you want to finish this workout?
        </p>

        <div className="mt-5 space-y-3 rounded-xl border border-border bg-surface p-4">
          <SummaryRow label="Duration" value={`${elapsedMinutes} min`} />
          <SummaryRow label="Exercises" value={String(exercises)} />
          <SummaryRow label="Sets" value={String(sets)} />
          <SummaryRow label="Total Volume" value={volume} />
        </div>

        <ProductButton fullWidth className="mt-5" onClick={() => onFinish("")}>
          Finish Workout
        </ProductButton>

        <button
          type="button"
          onClick={onClose}
          className="mt-3 h-11 w-full text-sm font-semibold text-muted-foreground hover:text-foreground"
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
