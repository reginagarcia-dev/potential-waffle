import React, { useState } from "react";
import { SessionExerciseResponse, WorkoutSetResponse } from "shared";
import { SetRow } from "./SetRow.js";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface ExerciseCardProps {
  exercise: SessionExerciseResponse;
  unit: "lbs" | "kg";
  onAddSet: (exerciseId: string, setType?: "warmup" | "working") => void;
  onToggleSetStatus: (set: WorkoutSetResponse) => void;
  onDeleteSet: (setId: string) => void;
  onDeleteExercise: (exerciseId: string) => void;
  onTriggerSetEdit: (set: WorkoutSetResponse) => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  unit,
  onAddSet,
  onToggleSetStatus,
  onDeleteSet,
  onDeleteExercise,
  onTriggerSetEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  // Reconstruct previous performance summary label
  const prevWorkingSets = exercise.sets.filter(
    (s) => s.previousWeight !== null && s.previousReps !== null,
  );

  const prefillLabel =
    prevWorkingSets.length > 0
      ? `From previous: ${prevWorkingSets.map((s) => `${s.previousWeight}×${s.previousReps}`).join(", ")}`
      : "First time doing this exercise";

  return (
    <div className="rounded-xl border border-zinc-900 bg-zinc-900/20 shadow-sm transition-all hover:border-zinc-800/80">
      {/* Header (Tap to Collapse) */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between p-4 cursor-pointer select-none"
      >
        <div className="space-y-0.5">
          <h3 className="font-heading text-base font-bold text-white transition-colors hover:text-teal-400">
            {exercise.nameSnapshot}
          </h3>
          <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide">
            {prefillLabel}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Delete exercise button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (
                confirm(`Remove ${exercise.nameSnapshot} from this workout?`)
              ) {
                onDeleteExercise(exercise.id);
              }
            }}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-950/60 text-zinc-500 hover:text-red-400 border border-transparent hover:border-zinc-800 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          {/* Toggle icon */}
          <div className="text-zinc-500">
            {isExpanded ? (
              <ChevronUp className="h-5 w-5" />
            ) : (
              <ChevronDown className="h-5 w-5" />
            )}
          </div>
        </div>
      </div>

      {/* Expandable sets list */}
      {isExpanded && (
        <div className="border-t border-zinc-900/60 p-4 pt-1 space-y-3">
          {/* Table column headers */}
          <div className="flex items-center justify-between text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-4 py-1">
            <span className="w-10">Set</span>
            <span className="flex-1 justify-start px-2">Previous</span>
            <span className="w-32 text-right pr-6">Weight & Reps</span>
            <span className="w-10 text-center">RPE</span>
            <span className="w-10 text-right">Done</span>
          </div>

          {/* Set Rows mapping */}
          <div className="space-y-1.5">
            {exercise.sets.map((set) => (
              <SetRow
                key={set.id}
                set={set}
                unit={unit}
                onToggleComplete={() => onToggleSetStatus(set)}
                onEdit={() => onTriggerSetEdit(set)}
                onDelete={() => onDeleteSet(set.id)}
              />
            ))}
          </div>

          {/* Add Set CTA */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => onAddSet(exercise.id, "working")}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-dashed border-zinc-800 py-2.5 text-xs font-bold text-zinc-400 transition-colors hover:border-zinc-700 hover:text-white"
            >
              <Plus className="h-3.5 w-3.5" />
              Add Set
            </button>
            <button
              type="button"
              onClick={() => onAddSet(exercise.id, "warmup")}
              className="flex items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs font-bold text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              + Warm-up
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExerciseCard;
