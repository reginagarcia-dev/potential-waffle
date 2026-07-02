import React, { useState, useRef, useEffect } from "react";
import { WorkoutSetResponse } from "shared";
import { Check, Trash2, Award } from "lucide-react";

interface SetRowProps {
  set: WorkoutSetResponse;
  unit: "lbs" | "kg";
  displaySetNumber?: number;
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateValue: (field: "weight" | "reps", value: number | null) => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  unit,
  displaySetNumber,
  onToggleComplete,
  onEdit,
  onDelete,
  onUpdateValue,
}) => {
  const [editingField, setEditingField] = useState<"weight" | "reps" | null>(null);
  const [editValue, setEditValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingField && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingField]);

  const startEdit = (field: "weight" | "reps") => {
    const current = field === "weight" ? set.weight : set.reps;
    setEditValue(current != null ? String(current) : "");
    setEditingField(field);
  };

  const commitEdit = () => {
    if (!editingField) return;
    const trimmed = editValue.trim();
    const parsed = trimmed === "" ? null : parseFloat(trimmed);
    onUpdateValue(editingField, parsed != null && !isNaN(parsed) ? parsed : null);
    setEditingField(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      commitEdit();
    } else if (e.key === "Escape") {
      setEditingField(null);
    }
  };

  const weightHasValue = set.weight != null;
  const repsHasValue = set.reps != null;

  const weightDisplay = weightHasValue
    ? String(set.weight)
    : set.previousWeight != null
      ? String(set.previousWeight)
      : "—";

  const repsDisplay = repsHasValue
    ? String(set.reps)
    : set.previousReps != null
      ? String(set.previousReps)
      : "—";

  const pillBase =
    "w-full justify-self-center rounded-full border px-3 py-2 text-center text-sm tabular-nums transition-all focus:outline-none focus:ring-2 focus:ring-ring";

  const weightPillStyle = weightHasValue
    ? `${pillBase} border-primary/30 bg-primary/10 font-semibold text-foreground hover:border-primary/60 hover:bg-primary/15`
    : set.previousWeight != null
      ? `${pillBase} border-dashed border-border bg-card font-medium text-muted-foreground/50 hover:border-primary/50 hover:bg-primary/10 hover:text-muted-foreground`
      : `${pillBase} border-border bg-card font-semibold text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground`;

  const repsPillStyle = repsHasValue
    ? `${pillBase} border-primary/30 bg-primary/10 font-semibold text-foreground hover:border-primary/60 hover:bg-primary/15`
    : set.previousReps != null
      ? `${pillBase} border-dashed border-border bg-card font-medium text-muted-foreground/50 hover:border-primary/50 hover:bg-primary/10 hover:text-muted-foreground`
      : `${pillBase} border-border bg-card font-semibold text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-foreground`;

  const inlineInputClass =
    "w-full justify-self-center rounded-full border border-primary bg-primary/10 px-3 py-2 text-center text-sm font-semibold tabular-nums text-foreground focus:outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="relative overflow-hidden rounded-xl">
      <div
        className={`relative grid grid-cols-[2rem_1fr_1fr_3rem_2.5rem] items-center gap-2 rounded-xl border px-4 py-3 transition-all ${
          set.type === "warmup"
            ? set.status === "completed"
              ? "border-warmup/35 bg-warmup/8 text-muted-foreground"
              : "border-warmup/25 bg-warmup/5 text-muted-foreground hover:border-warmup/40 hover:bg-warmup/10"
            : set.status === "completed"
              ? "border-primary/35 bg-primary/5 shadow-glow"
              : "border-border bg-surface/80 hover:border-primary/40 hover:bg-surface"
        }`}
      >
        {/* Set identifier — tap to open full edit sheet (RPE, set type, etc.) */}
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center"
          aria-label="Edit set details"
        >
          {set.type === "warmup" ? (
            <span className="inline-flex size-7 items-center justify-center rounded-full border border-warmup/40 bg-warmup/15 text-xs font-bold text-warmup">
              W
            </span>
          ) : (
            <span
              className={`text-sm font-bold tabular-nums ${
                set.status === "completed" ? "text-primary" : "text-muted-foreground"
              }`}
            >
              {displaySetNumber ?? set.setNumber}
            </span>
          )}
        </button>

        {/* Weight cell */}
        {editingField === "weight" ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="decimal"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            placeholder={set.previousWeight != null ? String(set.previousWeight) : "0"}
            className={inlineInputClass}
          />
        ) : (
          <button
            type="button"
            onClick={() => startEdit("weight")}
            className={`${weightPillStyle} max-w-24`}
          >
            {weightDisplay}
            <span className="ml-1 text-[10px] font-medium text-muted-foreground/60">
              {unit}
            </span>
          </button>
        )}

        {/* Reps cell */}
        {editingField === "reps" ? (
          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            placeholder={set.previousReps != null ? String(set.previousReps) : "0"}
            className={inlineInputClass}
          />
        ) : (
          <button
            type="button"
            onClick={() => startEdit("reps")}
            className={`${repsPillStyle} max-w-20`}
          >
            {repsDisplay}
          </button>
        )}

        {/* Complete toggle */}
        <div className="flex items-center justify-center gap-1">
          {set.isPr && set.status === "completed" && (
            <Award className="size-3.5 fill-accent/10 text-accent" />
          )}
          <button
            type="button"
            onClick={onToggleComplete}
            aria-label={set.status === "completed" ? "Mark set incomplete" : "Complete set"}
            className={`inline-flex size-7.5 items-center justify-center rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-ring ${
              set.type === "warmup"
                ? set.status === "completed"
                  ? "border-warmup bg-warmup/15 text-warmup"
                  : "border-muted-foreground/30 text-transparent hover:border-warmup hover:text-warmup"
                : set.status === "completed"
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-muted-foreground/30 text-transparent hover:border-primary hover:text-primary"
            }`}
          >
            <Check className="size-4" />
          </button>
        </div>

        {/* Delete */}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete set"
          className="inline-flex size-9 items-center justify-center justify-self-center rounded-full text-danger/70 transition-colors hover:bg-danger/10 hover:text-danger focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
};
export default SetRow;
