import { ArrowLeft, Clock, Dumbbell, Timer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProductButton } from "@/components/ui/ProductButton";

export function StartWorkoutPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>

        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Start Workout
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Set up your session and start logging.
          </p>
        </div>
      </header>

      <section className="rounded-xl border border-border bg-card p-4 shadow-card">
        <label
          htmlFor="workout-name"
          className="text-sm font-semibold text-foreground"
        >
          Workout name
        </label>

        <input
          id="workout-name"
          defaultValue="Workout — Today"
          className="mt-3 h-12 w-full rounded-lg border border-input bg-surface px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </section>

      <section className="rounded-xl border border-border bg-card p-4 shadow-card">
        <div className="mb-4 flex items-center gap-2">
          <Dumbbell className="size-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Start from</h2>
        </div>

        <button
          type="button"
          className="flex w-full items-center justify-between rounded-xl border border-primary/40 bg-primary/10 p-4 text-left transition hover:bg-primary/15"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              Blank Workout
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add exercises as you go.
            </p>
          </div>

          <div className="inline-flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            ✓
          </div>
        </button>

        <button
          type="button"
          disabled
          className="mt-3 flex w-full items-center justify-between rounded-xl border border-border bg-surface p-4 text-left opacity-50"
        >
          <div>
            <p className="text-sm font-semibold text-foreground">
              Choose Template
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Coming soon.</p>
          </div>
        </button>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Dumbbell className="size-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Unit</p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              className="h-10 rounded-lg bg-primary text-sm font-semibold text-primary-foreground"
            >
              lbs
            </button>

            <button
              type="button"
              className="h-10 rounded-lg border border-border bg-surface text-sm font-semibold text-muted-foreground"
            >
              kg
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center gap-2">
            <Timer className="size-4 text-primary" />
            <p className="text-sm font-semibold text-foreground">Rest</p>
          </div>

          <button
            type="button"
            className="flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-semibold text-foreground"
          >
            <Clock className="size-4 text-muted-foreground" />
            3:00
          </button>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold text-foreground">
          Recent workout
        </h2>

        <button
          type="button"
          className="mt-3 w-full rounded-xl border border-border bg-surface p-4 text-left transition hover:bg-muted/60"
        >
          <p className="text-sm font-semibold text-foreground">Lower Body A</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Jun 21 · 54 min · 18 sets
          </p>
          <p className="mt-2 text-xs text-primary">
            Start blank workout and add the same exercises manually for now.
          </p>
        </button>
      </section>

      <div className="mt-auto sticky bottom-20 rounded-xl border border-border bg-background/95 pt-2 backdrop-blur">
        <ProductButton fullWidth onClick={() => navigate("/session/active")}>
          Start Workout
        </ProductButton>
      </div>
    </div>
  );
}
