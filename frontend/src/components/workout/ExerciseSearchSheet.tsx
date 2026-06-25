import { ChevronRight, Search, X } from "lucide-react";
import { ProductButton } from "@/components/ui/ProductButton";

type ExerciseSearchSheetProps = {
  open: boolean;
  onClose: () => void;
  onSelectExercise: (exerciseName: string) => void;
};

const exercises = [
  "Back Squat",
  "Front Squat",
  "Romanian Deadlift",
  "Leg Press",
  "Bulgarian Split Squat",
];

const filters = ["All", "Barbell", "Dumbbell", "Machine", "Bodyweight"];

export function ExerciseSearchSheet({
  open,
  onClose,
  onSelectExercise,
}: ExerciseSearchSheetProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="mx-auto max-h-[85dvh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-4 shadow-elevated">
        <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            Add Exercise (new)
          </h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Search exercises"
            className="h-11 w-full rounded-lg border border-input bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mt-3 flex gap-2 overflow-x-auto">
          {filters.map((filter) => (
            <button
              key={filter}
              className="shrink-0 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground first:border-primary first:bg-primary/10 first:text-primary"
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="mt-5">
          <p className="mb-2 text-sm font-semibold text-foreground">Popular</p>

          <div className="space-y-2">
            {exercises.map((exercise) => (
              <button
                key={exercise}
                type="button"
                onClick={() => onSelectExercise(exercise)}
                className="flex h-12 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-left text-sm font-medium text-foreground transition hover:bg-muted/60"
              >
                {exercise}
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>

        <ProductButton
          variant="secondary"
          fullWidth
          className="mt-5 border-primary/40 text-primary hover:bg-primary/10"
        >
          + Create Custom Exercise
        </ProductButton>
      </div>
    </div>
  );
}
