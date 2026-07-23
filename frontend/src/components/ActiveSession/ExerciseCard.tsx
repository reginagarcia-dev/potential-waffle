import React, { useState } from "react";
import { SessionExerciseResponse, WorkoutSetResponse } from "shared";
import { SetRow } from "./SetRow";
import { DeleteExerciseSheet } from "./DeleteExerciseSheet";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface ExerciseCardProps {
  exercise: SessionExerciseResponse;
  unit: "lbs" | "kg";
  onAddSet: (exerciseId: string, setType?: "warmup" | "working") => void;
  onToggleSetStatus: (set: WorkoutSetResponse) => void;
  onDeleteSet: (setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onTriggerSetEdit: (set: WorkoutSetResponse) => void;
  onUpdateSetValue: (set: WorkoutSetResponse, field: "weight" | "reps", value: number | null) => void;
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
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  let workingSetDisplayNumber = 0;

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
            {/* Column headers */}
            <div className="grid grid-cols-[2rem_1fr_1fr_3rem_2.5rem] items-center gap-2 px-4 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <span>Set</span>
              <span className="text-center">Weight</span>
              <span className="text-center">Reps</span>
              <span className="text-center">Done</span>
              <span></span>
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
