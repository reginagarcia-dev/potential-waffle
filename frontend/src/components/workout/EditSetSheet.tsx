import { X } from "lucide-react";
import { ProductButton } from "@/components/ui/ProductButton";

type EditSetSheetProps = {
  open: boolean;
  setLabel: string;
  previous?: string;
  weight: number;
  reps: number;
  rpe?: number;
  isWarmup?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  onWeightChange: (value: number) => void;
  onRepsChange: (value: number) => void;
  onRpeChange: (value: number) => void;
  onWarmupChange: (value: boolean) => void;
};

export function EditSetSheet({
  open,
  setLabel,
  previous,
  weight,
  reps,
  rpe,
  isWarmup = false,
  onClose,
  onConfirm,
  onWeightChange,
  onRepsChange,
  onRpeChange,
  onWarmupChange,
}: EditSetSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <div className="fixed inset-x-0 bottom-0 mx-auto max-h-[85dvh] w-full max-w-md rounded-t-2xl border-t border-border bg-card p-4 shadow-elevated">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Edit {setLabel}
            </h2>
            {previous ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Previous: {previous}
              </p>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <NumericStepper
            label="Weight"
            value={weight}
            unit="lbs"
            onDecrement={() => onWeightChange(Math.max(0, weight - 5))}
            onIncrement={() => onWeightChange(weight + 5)}
          />

          <NumericStepper
            label="Reps"
            value={reps}
            onDecrement={() => onRepsChange(Math.max(0, reps - 1))}
            onIncrement={() => onRepsChange(reps + 1)}
          />

          <NumericStepper
            label="RPE"
            value={rpe ?? 0}
            onDecrement={() => onRpeChange(Math.max(0, (rpe ?? 0) - 1))}
            onIncrement={() => onRpeChange(Math.min(10, (rpe ?? 0) + 1))}
          />

          <label className="flex h-12 items-center justify-between rounded-lg border border-border bg-surface px-4">
            <span className="text-sm font-medium text-foreground">
              Warm-up set
            </span>

            <input
              type="checkbox"
              checked={isWarmup}
              onChange={(event) => onWarmupChange(event.target.checked)}
              className="size-5 accent-primary"
            />
          </label>

          <ProductButton fullWidth onClick={onConfirm}>
            Confirm Set
          </ProductButton>
        </div>
      </div>
    </div>
  );
}

type NumericStepperProps = {
  label: string;
  value: number;
  unit?: string;
  onDecrement: () => void;
  onIncrement: () => void;
};

function NumericStepper({
  label,
  value,
  unit,
  onDecrement,
  onIncrement,
}: NumericStepperProps) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <label className="text-sm font-medium text-muted-foreground">
        {label}
      </label>

      <div className="mt-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onDecrement}
          className="inline-flex size-10 items-center justify-center rounded-full bg-muted/50 text-foreground"
        >
          −
        </button>

        <div className="text-center">
          <div className="text-3xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </div>
          {unit ? (
            <div className="text-xs text-muted-foreground">{unit}</div>
          ) : null}
        </div>

        <button
          type="button"
          onClick={onIncrement}
          className="inline-flex size-10 items-center justify-center rounded-full bg-muted/50 text-foreground"
        >
          +
        </button>
      </div>
    </div>
  );
}
