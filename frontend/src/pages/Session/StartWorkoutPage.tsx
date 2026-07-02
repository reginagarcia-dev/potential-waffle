import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";

import { useAuth } from "../../context/AuthContext.js";
import { ProductButton } from "@/components/ui/ProductButton";
import { BinaryToggle } from "@/components/ui/BinaryToggle";
import { ArrowLeft, Dumbbell, Timer, ChevronDown } from "lucide-react";
import { WorkoutSessionResponse } from "shared";

export const StartWorkoutPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, updateUserPreferences } = useAuth();

  // Dynamic default name, e.g. "Tuesday Workout"
  const getDefaultName = () => {
    const day = new Date().toLocaleDateString(undefined, { weekday: "long" });
    return `${day} Workout`;
  };

  const [name, setName] = useState(getDefaultName());
  const [unit, setUnit] = useState<"lbs" | "kg">(user?.preferredUnit || "lbs");
  const [restSeconds, setRestSeconds] = useState(
    user?.defaultRestSeconds || 180,
  );
  const [error, setError] = useState<string | null>(null);

  const { data: recentSessions = [] } = useQuery<WorkoutSessionResponse[]>({
    queryKey: ["recentSessions", 1],
    queryFn: () => apiFetch("/sessions?page=1&limit=1"),
  });
  const recentSession = recentSessions[0] ?? null;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  const formatDuration = (start: string, end: string) => {
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return m === 0 ? `${h}h` : `${h}h ${m}m`;
  };

  const countSets = (session: WorkoutSessionResponse) =>
    session.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  // Mutation to start the workout session
  const startSessionMutation = useMutation({
    mutationFn: (body: { name: string; unit: string }) =>
      apiFetch("/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data) => {
      // Invalidate active session query cache
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      // Redirect to the active session workspace
      navigate(`/session/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.message || "Failed to start workout session");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please provide a workout name");
      return;
    }

    try {
      // If user preferences are different, update them in background
      if (
        user &&
        (unit !== user.preferredUnit || restSeconds !== user.defaultRestSeconds)
      ) {
        await updateUserPreferences(unit, restSeconds);
      }

      startSessionMutation.mutate({
        name: name.trim(),
        unit,
      });
    } catch (err: any) {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <>
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
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger ring-1 ring-danger/20">
              {error}
            </div>
          )}
          <section className="rounded-xl border border-border bg-card p-4 shadow-card">
            <label
              htmlFor="workout-name"
              className="text-sm font-semibold text-foreground"
            >
              Workout name
            </label>

            <input
              id="workout-name"
              onChange={(e) => setName(e.target.value)}
              defaultValue="Workout — Today"
              className="mt-3 h-12 w-full rounded-lg border border-input bg-surface px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </section>

          {/* <section className="rounded-xl border border-border bg-card p-4 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Dumbbell className="size-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">
                Start from
              </h2>
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
                <p className="mt-1 text-xs text-muted-foreground">
                  Coming soon.
                </p>
              </div>
            </button>
          </section> */}

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Dumbbell className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Unit</p>
              </div>

              <BinaryToggle
                value={unit}
                onChange={setUnit}
                left={{ label: "lbs", value: "lbs" }}
                right={{ label: "kg", value: "kg" }}
              />
            </div>

            <div className="rounded-xl border border-border bg-card p-4">
              <div className="mb-3 flex items-center gap-2">
                <Timer className="size-4 text-primary" />
                <p className="text-sm font-semibold text-foreground">Rest</p>
              </div>

              <div className="relative">
                <select
                  id="rest-seconds"
                  value={restSeconds}
                  onChange={(e) => setRestSeconds(parseInt(e.target.value))}
                  className="block w-full appearance-none rounded-lg border border-input bg-surface px-3 py-3 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary text-sm font-semibold"
                >
                  <option value={60}>1 minute</option>
                  <option value={90}>1 min 30s</option>
                  <option value={120}>2 minutes</option>
                  <option value={150}>2 mins 30s</option>
                  <option value={180}>3 minutes</option>
                  <option value={240}>4 minutes</option>
                  <option value={300}>5 minutes</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>
          </section>

          {recentSession && (
            <section className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold text-foreground">
                Recent workout
              </h2>
              <div className="mt-3 w-full rounded-xl border border-border bg-surface p-4 text-left">
                <p className="text-sm font-semibold text-foreground">
                  {recentSession.name}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatDate(recentSession.completedAt!)}
                  {" · "}
                  {formatDuration(recentSession.startedAt, recentSession.completedAt!)}
                  {" · "}
                  {countSets(recentSession)} sets
                </p>
              </div>
            </section>
          )}

          <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-md px-4 pb-4 ">
            {startSessionMutation.isPending ? (
              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-primary-foreground"></div>
            ) : (
              <ProductButton type="submit" fullWidth>
                Start Workout
              </ProductButton>
            )}
          </div>
        </form>
      </div>
    </>
  );
};
export default StartWorkoutPage;
