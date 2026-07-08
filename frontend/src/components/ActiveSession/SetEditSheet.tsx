import React, { useState, useEffect } from "react";
import { WorkoutSetResponse } from "shared";
import { X, Plus, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductButton } from "../ui/ProductButton";
import { useModalDialog } from "@/hooks/useModalDialog";

interface SetEditSheetProps {
  isOpen: boolean;
  set: WorkoutSetResponse | null;
  unit: "lbs" | "kg";
  onClose: () => void;
  onConfirm: (data: {
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    type: "warmup" | "working";
  }) => void;
}

export const SetEditSheet: React.FC<SetEditSheetProps> = ({
  isOpen,
  set,
  unit,
  onClose,
  onConfirm,
}) => {
  const dialogRef = useModalDialog(isOpen, {
    closeOnBackdropClick: true,
    onClose,
  });

  // Form states
  const [weight, setWeight] = useState<number | "">("");
  const [reps, setReps] = useState<number | "">("");
  const [rpe, setRpe] = useState<number | "">("");
  const [setType, setSetType] = useState<"warmup" | "working">("working");

  // Initialize values when set changes
  useEffect(() => {
    if (set) {
      setWeight(set.weight !== null ? set.weight : "");
      setReps(set.reps !== null ? set.reps : "");
      setRpe(set.rpe !== null ? set.rpe : "");
      setSetType(set.type);
    }
  }, [set]);

  // Guard against leaving the document inert if the active set is cleared
  // while the native dialog is still open.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!set && dialog?.open) {
      dialog.close();
    }
  }, [set, dialogRef]);

  if (!set) return null;

  const handleConfirmSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      weight: weight === "" ? null : Number(weight),
      reps: reps === "" ? null : Number(reps),
      rpe: rpe === "" ? null : Number(rpe),
      type: setType,
    });
    onClose();
  };

  const adjustVal = (
    val: number | "",
    setter: React.Dispatch<React.SetStateAction<any>>,
    amount: number,
    min: number = 0,
  ) => {
    const current = val === "" ? 0 : val;
    const nextVal = Math.max(min, current + amount);
    setter(nextVal === 0 && min > 0 ? "" : nextVal);
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "m-auto w-[min(100%-2rem,26rem)] max-w-md rounded-2xl border border-border bg-card p-0 text-foreground shadow-elevated",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "max-h-[85dvh] overflow-hidden focus:outline-none",
      )}
    >
      <div className="flex max-h-[85dvh] flex-col">
        {/* Header */}
        <div className="px-5 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {setType === "warmup" ? "Edit Warm-up Set" : `Edit Set `}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Update weight, reps, or mark as warm-up.
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close edit set"
              className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <form
          onSubmit={handleConfirmSubmit}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
            {/* Weight */}
            <div className="rounded-xl border border-border bg-surface/80 p-3.5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Weight
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Measured in {unit}
                  </p>
                </div>
                {set.previousWeight != null && (
                  <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/60">
                    Last: {set.previousWeight} {unit}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustVal(weight, setWeight, -5)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Minus className="size-4" />
                </button>

                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={weight}
                    onChange={(e) =>
                      setWeight(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-11 w-24 rounded-xl border border-border bg-card px-3 text-center text-xl font-semibold tabular-nums tracking-tight text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />

                  <span className="text-sm font-semibold text-muted-foreground">
                    {unit}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustVal(weight, setWeight, 5)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* Reps */}
            <div className="rounded-xl border border-border bg-surface/80 p-3.5">
              <div className="mb-3 flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-foreground">Reps</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Number of repetitions completed
                  </p>
                </div>
                {set.previousReps != null && (
                  <span className="mt-0.5 shrink-0 text-xs text-muted-foreground/60">
                    Last: {set.previousReps} reps
                  </span>
                )}
              </div>

              <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center gap-3">
                <button
                  type="button"
                  onClick={() => adjustVal(reps, setReps, -1)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Minus className="size-4" />
                </button>

                <div className="flex items-center justify-center gap-2">
                  <input
                    type="number"
                    placeholder="0"
                    value={reps}
                    onChange={(e) =>
                      setReps(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    className="h-11 w-24 rounded-xl border border-border bg-card px-3 text-center text-xl font-semibold tabular-nums tracking-tight text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />

                  <span className="text-sm font-semibold text-muted-foreground">
                    reps
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => adjustVal(reps, setReps, 1)}
                  className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:border-primary/50 hover:bg-primary/10 hover:text-primary active:scale-95 focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <Plus className="size-4" />
                </button>
              </div>
            </div>

            {/* Warm-up Toggle */}
            <div className="rounded-xl border border-border bg-surface/80 p-3.5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Warm-up set
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Excluded from volume and PRs.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSetType((prev) =>
                      prev === "warmup" ? "working" : "warmup",
                    )
                  }
                  aria-pressed={setType === "warmup"}
                  className={cn(
                    "relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border transition-colors focus:outline-none focus:ring-2 focus:ring-ring",
                    setType === "warmup"
                      ? "border-primary bg-primary"
                      : "border-border bg-muted",
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block size-6 translate-y-px rounded-full bg-foreground shadow transition-transform",
                      setType === "warmup"
                        ? "translate-x-5"
                        : "translate-x-0.5",
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-0 border-border bg-card px-5 py-4">
            <ProductButton fullWidth type="submit">
              Save Set
            </ProductButton>
          </div>
        </form>
      </div>
    </dialog>
  );
};
export default SetEditSheet;
