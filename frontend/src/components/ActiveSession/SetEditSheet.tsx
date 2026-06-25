import React, { useState, useEffect, useRef } from "react";
import { WorkoutSetResponse } from "shared";
import { X, Plus, Minus } from "lucide-react";

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
  const dialogRef = useRef<HTMLDialogElement | null>(null);

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

  // Handle open/close native dialog
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

  // Fallback backdrop click dismissal handler
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
      className="m-auto w-[min(100%-2rem,40rem)] max-w-lg rounded-2xl border border-zinc-800 bg-zinc-950 p-6 shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm focus:outline-none max-h-[85vh] overflow-y-auto"
    >
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
          <h3 className="font-heading text-lg font-bold text-white">
            Edit Set {set.setNumber}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleConfirmSubmit} className="mt-5 space-y-6">
          {/* Weight row */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-zinc-400">
              Weight ({unit})
            </span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustVal(weight, setWeight, -5)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={weight}
                onChange={(e) =>
                  setWeight(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-20 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-center font-bold text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
              />
              <button
                type="button"
                onClick={() => adjustVal(weight, setWeight, 5)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Reps row */}
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-zinc-400">Reps</span>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustVal(reps, setReps, -1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                placeholder="0"
                value={reps}
                onChange={(e) =>
                  setReps(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-20 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-center font-bold text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
              />
              <button
                type="button"
                onClick={() => adjustVal(reps, setReps, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* RPE row */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-zinc-400">
                RPE (1-10)
              </span>
              <span className="text-[10px] text-zinc-500">
                Rate of perceived exertion
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => adjustVal(rpe, setRpe, -0.5, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                type="number"
                step="0.5"
                placeholder="—"
                value={rpe}
                onChange={(e) =>
                  setRpe(e.target.value === "" ? "" : Number(e.target.value))
                }
                className="w-20 rounded-lg border border-zinc-800 bg-zinc-950 px-2.5 py-1.5 text-center font-bold text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 text-sm"
              />
              <button
                type="button"
                onClick={() => adjustVal(rpe, setRpe, 0.5, 1)}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white active:scale-95"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Set Type toggle */}
          <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
            <span className="text-sm font-semibold text-zinc-400">
              Warm-up set
            </span>
            <button
              type="button"
              onClick={() =>
                setSetType((prev) => (prev === "warmup" ? "working" : "warmup"))
              }
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                setType === "warmup" ? "bg-teal-600" : "bg-zinc-800"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  setType === "warmup" ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-500"
          >
            Confirm Set
          </button>
        </form>
      </div>
    </dialog>
  );
};
export default SetEditSheet;
