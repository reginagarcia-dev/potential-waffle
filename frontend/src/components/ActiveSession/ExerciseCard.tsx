import React, { useState } from "react";
import { SessionExerciseResponse, WorkoutSetResponse } from "shared";
import { SetRow } from "./SetRow";
import { DeleteExerciseSheet } from "./DeleteExerciseSheet";
import { ChevronDown, ChevronUp, Plus, TrendingUp, Trash2, X } from "lucide-react";

interface ExerciseCardProps {
  exercise: SessionExerciseResponse;
  unit: "lbs" | "kg";
  onAddSet: (exerciseId: string, setType?: "warmup" | "working") => void;
  onToggleSetStatus: (set: WorkoutSetResponse) => void;
  onDeleteSet: (setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onTriggerSetEdit: (set: WorkoutSetResponse) => void;
  onUpdateSetValue: (set: WorkoutSetResponse, field: "weight" | "reps", value: number | null) => void;
  onApplySuggestion: (exerciseId: string, weight: number, reps: number | null) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  unit,
  onAddSet,
  onToggleSetStatus,
  onDeleteSet,
  onDeleteExercise,
  onTriggerSetEdit,
  onUpdateSetValue,
  onApplySuggestion,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [suggestionDismissed, setSuggestionDismissed] = useState(false);

  let workingSetDisplayNumber = 0;

  const pendingWorkingSets = exercise.sets.filter(
    (s) => s.type === "working" && s.status === "pending" && s.previousWeight != null && s.weight == null,
  );
  const increment = unit === "kg" ? 2.5 : 5;
  const suggestion = (() => {
    if (pendingWorkingSets.length === 0) return null;
    const maxPrev = Math.max(...pendingWorkingSets.map((s) => s.previousWeight!));
    const anchor = pendingWorkingSets.find((s) => s.previousWeight === maxPrev)!;
    return { weight: maxPrev + increment, reps: anchor.previousReps ?? null };
  })();

  return (
    <>
      <div className="rounded-xl border border-border bg-card shadow-card transition-all hover:border-border/70">
        {/* Header */}
        <div
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex cursor-pointer select-none items-center justify-between p-4"
        >
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">
              {exercise.nameSnapshot}
            </h3>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDeleteOpen(true);
              }}
              className="inline-flex size-8 items-center justify-center rounded-full text-danger/70 transition-colors hover:bg-danger/10 hover:text-danger"
            >
              <Trash2 className="size-4" />
            </button>

            <div className="text-muted-foreground">
              {isExpanded ? (
                <ChevronUp className="size-5" />
              ) : (
                <ChevronDown className="size-5" />
              )}
            </div>
          </div>
        </div>

        {/* Sets list */}
        {isExpanded && (
          <div className="space-y-3 border-t border-border p-4 pt-2">
            {/* Progressive overload suggestion */}
            {suggestion && !suggestionDismissed && (
              <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">
                    Suggest: {suggestion.weight} {unit}
                    {suggestion.reps != null ? ` × ${suggestion.reps}` : ""}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onApplySuggestion(exercise.id, suggestion.weight, suggestion.reps)}
                    className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary transition hover:bg-primary/20"
                  >
                    Apply
                  </button>
                  <button
                    type="button"
                    onClick={() => setSuggestionDismissed(true)}
                    aria-label="Dismiss suggestion"
                    className="inline-flex size-6 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_1fr_3rem_2.5rem] items-center gap-2 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Set</span>
              <span className="text-center">Weight</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Done</span>
              <span className="text-center">Del</span>
            </div>

            <div className="space-y-1.5">
              {exercise.sets.map((set) =>
                set.type === "warmup" ? (
                  <SetRow
                    key={set.id}
                    set={set}
                    unit={unit}
                    onToggleComplete={() => onToggleSetStatus(set)}
                    onEdit={() => onTriggerSetEdit(set)}
                    onDelete={() => onDeleteSet(set.id)}
                    onUpdateValue={(field, value) => onUpdateSetValue(set, field, value)}
                  />
                ) : (
                  <SetRow
                    key={set.id}
                    set={set}
                    unit={unit}
                    displaySetNumber={++workingSetDisplayNumber}
                    onToggleComplete={() => onToggleSetStatus(set)}
                    onEdit={() => onTriggerSetEdit(set)}
                    onDelete={() => onDeleteSet(set.id)}
                    onUpdateValue={(field, value) => onUpdateSetValue(set, field, value)}
                  />
                ),
              )}
            </div>

            {/* Add Set */}
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => onAddSet(exercise.id, "working")}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
              >
                <Plus className="size-4" />
                Add Set
              </button>
              <button
                type="button"
                onClick={() => onAddSet(exercise.id, "warmup")}
                className="flex items-center justify-center rounded-lg border border-warmup/40 bg-warmup/10 px-3 py-2 text-xs font-semibold text-warmup transition-colors hover:bg-warmup/20"
              >
                + Warm-up
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteExerciseSheet
        isOpen={isDeleteOpen}
        exerciseName={exercise.nameSnapshot}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => onDeleteExercise(exercise.id)}
      />
    </>
  );
};
export default ExerciseCard;
