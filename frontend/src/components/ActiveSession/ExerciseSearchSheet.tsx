import React, { useEffect, useRef, useState } from "react";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Dumbbell, Plus, Search, X } from "lucide-react";
import { apiFetch } from "../../lib/api.js";
import { cn } from "../../lib/utils";
import { ExerciseDefinition, MuscleGroup, CustomExerciseInput } from "shared";
import { ProductButton } from "@/components/ui/ProductButton";
import { useModalDialog } from "@/hooks/useModalDialog";

interface ExerciseSearchSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseDefinitionId: string) => void;
}

const MUSCLE_GROUPS: MuscleGroup[] = ["legs", "push", "pull", "core", "cardio"];

const muscleGroupLabels: Record<MuscleGroup, string> = {
  legs: "Legs",
  push: "Push",
  pull: "Pull",
  core: "Core",
  cardio: "Cardio",
};

export const ExerciseSearchSheet: React.FC<ExerciseSearchSheetProps> = ({
  isOpen,
  onClose,
  onSelectExercise,
}) => {
  const dialogRef = useModalDialog(isOpen, {
    closeOnBackdropClick: true,
    onClose,
  });
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [muscleGroup, setMuscleGroup] = useState<MuscleGroup | "">("");

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(id);
  }, [search]);

  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customMuscleGroup, setCustomMuscleGroup] =
    useState<MuscleGroup>("push");
  const [customError, setCustomError] = useState<string | null>(null);

  // Focus the search field once the dialog is open
  useEffect(() => {
    if (!isOpen) return;
    const id = window.setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
    return () => window.clearTimeout(id);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setSearch("");
      setDebouncedSearch("");
      setMuscleGroup("");
      setShowCustomForm(false);
      setCustomName("");
      setCustomError(null);
      setCustomMuscleGroup("push");
    }
  }, [isOpen]);

  const { data: exercises = [], isLoading } = useQuery<ExerciseDefinition[]>({
    queryKey: ["exercises", debouncedSearch, muscleGroup],
    queryFn: () => {
      let query = `/exercises?q=${encodeURIComponent(debouncedSearch)}`;

      if (muscleGroup) {
        query += `&muscleGroup=${muscleGroup}`;
      }

      return apiFetch(query);
    },
    enabled: isOpen,
    placeholderData: keepPreviousData,
  });

  const createExerciseMutation = useMutation({
    mutationFn: (body: CustomExerciseInput) =>
      apiFetch("/exercises", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (newExercise) => {
      queryClient.invalidateQueries({ queryKey: ["exercises"] });

      onSelectExercise(newExercise.id);

      setCustomName("");
      setShowCustomForm(false);
      setCustomError(null);
      onClose();
    },
    onError: (err: any) => {
      setCustomError(err.message || "Failed to create exercise");
    },
  });

  const handleCreateCustom = (event: React.FormEvent) => {
    event.preventDefault();

    if (!customName.trim()) {
      setCustomError("Exercise name is required");
      return;
    }

    setCustomError(null);

    createExerciseMutation.mutate({
      name: customName.trim(),
      muscleGroup: customMuscleGroup,
    });
  };

  const handleSelect = (id: string) => {
    // debugger;
    onSelectExercise(id);
    onClose();
  };

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className={cn(
        "m-auto w-[min(100%-2rem,28rem)] max-w-md rounded-2xl border border-border bg-card p-0 text-foreground shadow-elevated",
        "backdrop:bg-black/60 backdrop:backdrop-blur-sm",
        "max-h-[85dvh] overflow-hidden focus:outline-none",
      )}
    >
      <div className="flex max-h-[85dvh] flex-col">
        <div className="px-4 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold tracking-tight text-foreground">
                {showCustomForm ? "Create Exercise" : "Add Exercise"}
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                {showCustomForm
                  ? "Add a custom movement to your library."
                  : "Search your library or create a custom exercise."}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              aria-label="Close add exercise"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        {!showCustomForm ? (
          <>
            <div className="space-y-4 px-4 pt-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

                <input
                  ref={searchInputRef}
                  type="text"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search exercises"
                  className={cn(
                    "h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                  )}
                />
              </div>

              <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
                <FilterChip
                  label="All"
                  active={muscleGroup === ""}
                  onClick={() => setMuscleGroup("")}
                />

                {MUSCLE_GROUPS.map((group) => (
                  <FilterChip
                    key={group}
                    label={muscleGroupLabels[group]}
                    active={muscleGroup === group}
                    onClick={() => setMuscleGroup(group)}
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {isLoading ? (
                <ExerciseListMessage
                  title="Loading exercise library"
                  description="Finding matching exercises..."
                />
              ) : exercises.length > 0 ? (
                <div className="space-y-2">
                  {exercises.map((exercise) => (
                    <ExerciseResultRow
                      key={exercise.id}
                      exercise={exercise}
                      onClick={() => handleSelect(exercise.id)}
                    />
                  ))}
                </div>
              ) : (
                <ExerciseListMessage
                  title="No exercises found"
                  description={
                    search
                      ? `No results for “${search}”. Try a different search or create a custom exercise.`
                      : "Try a different muscle group or create a custom exercise."
                  }
                />
              )}
            </div>

            <div className="border-t border-border px-4 py-4">
              <button
                type="button"
                onClick={() => setShowCustomForm(true)}
                className="mt-2 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border border-primary/40 text-sm font-semibold text-primary hover:bg-primary/10"
              >
                <Plus className="size-4" />
                Create Custom Exercise
              </button>
            </div>
          </>
        ) : (
          <form
            onSubmit={handleCreateCustom}
            className="mt-5 flex min-h-0 flex-1 flex-col px-4 pb-4"
          >
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              {customError ? (
                <div className="rounded-lg border border-danger/30 bg-danger/10 p-3 text-sm text-danger">
                  {customError}
                </div>
              ) : null}

              <div>
                <label
                  htmlFor="custom-exercise-name"
                  className="text-sm font-semibold text-foreground"
                >
                  Exercise name
                </label>

                <input
                  id="custom-exercise-name"
                  type="text"
                  required
                  value={customName}
                  onChange={(event) => setCustomName(event.target.value)}
                  placeholder="e.g. Incline DB Hammer Curl"
                  className={cn(
                    "mt-2 h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm text-foreground",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                  )}
                />
              </div>

              <div>
                <label
                  htmlFor="custom-muscle-group"
                  className="text-sm font-semibold text-foreground"
                >
                  Muscle group
                </label>

                <select
                  id="custom-muscle-group"
                  value={customMuscleGroup}
                  onChange={(event) =>
                    setCustomMuscleGroup(event.target.value as MuscleGroup)
                  }
                  className={cn(
                    "mt-2 h-11 w-full rounded-lg border border-input bg-surface px-3 text-sm font-medium text-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring",
                  )}
                >
                  {MUSCLE_GROUPS.map((group) => (
                    <option key={group} value={group}>
                      {muscleGroupLabels[group]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowCustomForm(false);
                  setCustomError(null);
                }}
                className={cn(
                  "inline-flex h-12 items-center justify-center rounded-xl border border-border bg-surface",
                  "text-sm font-semibold text-foreground transition",
                  "hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring",
                )}
              >
                Back
              </button>

              <ProductButton type="submit" fullWidth disabled={createExerciseMutation.isPending}>
                {createExerciseMutation.isPending ? "Creating..." : "Create & Add"}
              </ProductButton>
            </div>
          </form>
        )}
      </div>
    </dialog>
  );
};

type FilterChipProps = {
  label: string;
  active: boolean;
  onClick: () => void;
};

function FilterChip({ label, active, onClick }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-surface text-muted-foreground hover:bg-muted/60 hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

type ExerciseResultRowProps = {
  exercise: ExerciseDefinition;
  onClick: () => void;
};

function ExerciseResultRow({ exercise, onClick }: ExerciseResultRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border border-border bg-surface px-3 py-3 text-left",
        "transition hover:border-primary/40 hover:bg-primary/10 focus:outline-none focus:ring-2 focus:ring-ring",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          className={cn(
            "flex size-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground",
            "transition group-hover:border-primary/40 group-hover:text-primary",
          )}
        >
          <Dumbbell className="size-4" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-foreground transition group-hover:text-primary">
              {exercise.name}
            </p>

            {exercise.isCustom ? (
              <span className="shrink-0 rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                Custom
              </span>
            ) : null}
          </div>

          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            {muscleGroupLabels[exercise.muscleGroup] ?? exercise.muscleGroup}
          </p>
        </div>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition group-hover:text-primary" />
    </button>
  );
}

type ExerciseListMessageProps = {
  title: string;
  description: string;
};

function ExerciseListMessage({ title, description }: ExerciseListMessageProps) {
  return (
    <div className="flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/40 px-6 py-8 text-center">
      <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
        <Dumbbell className="size-5" />
      </div>

      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default ExerciseSearchSheet;
