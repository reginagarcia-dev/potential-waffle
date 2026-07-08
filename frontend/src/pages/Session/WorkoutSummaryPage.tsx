import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import { ChevronDown } from "lucide-react";
import { WorkoutSessionResponse } from "shared";
import { PRBadge } from "@/components/workout/PRBadge";
import { ProductButton } from "@/components/ui/ProductButton";

export const WorkoutSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [expandedExerciseIds, setExpandedExerciseIds] = useState<Set<string>>(
    () => new Set(),
  );

  const { data: session, isLoading } = useQuery<WorkoutSessionResponse>({
    queryKey: ["sessionSummary", id],
    queryFn: () => apiFetch(`/sessions/${id}`),
  });

  const toggleExerciseExpanded = (exerciseId: string) => {
    setExpandedExerciseIds((current) => {
      const next = new Set(current);

      if (next.has(exerciseId)) {
        next.delete(exerciseId);
      } else {
        next.add(exerciseId);
      }

      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-primary">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h3 className="text-lg font-semibold text-danger">
            Workout not found
          </h3>

          <button
            type="button"
            onClick={() => navigate("/")}
            className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  const durationSeconds =
    session.completedAt && session.startedAt
      ? Math.max(
          0,
          Math.floor(
            (new Date(session.completedAt).getTime() -
              new Date(session.startedAt).getTime()) /
              1000,
          ),
        )
      : 0;

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const setsCount = session.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.filter(
        (set) => set.status === "completed" && set.type !== "warmup",
      ).length
    );
  }, 0);

  const prList: Array<{ name: string; weight: number; reps: number }> = [];

  session.exercises.forEach((ex) => {
    ex.sets.forEach((set) => {
      if (set.isPr && set.weight && set.reps) {
        prList.push({
          name: ex.nameSnapshot,
          weight: set.weight,
          reps: set.reps,
        });
      }
    });
  });

  return (
    <div className="flex min-h-dvh flex-col bg-background px-4 py-5 pb-24 text-foreground">
      {/* Header */}
      <header className="flex items-center gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
            Workout Complete 🎉
          </h1>

          <p className="mt-1 truncate text-sm text-muted-foreground">
            {session.name}
          </p>
        </div>
      </header>

      {/* Metrics Strip */}
      <section className="mt-4 grid grid-cols-3 overflow-hidden rounded-xl border border-border bg-card shadow-card">
        <div className="border-r border-border px-2 py-3 text-center">
          <p className="text-base font-semibold tabular-nums text-foreground">
            {formatDuration(durationSeconds)}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Duration
          </p>
        </div>

        <div className="border-r border-border px-2 py-3 text-center">
          <p className="text-base font-semibold tabular-nums text-foreground">
            {session.exercises.length}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Exercises
          </p>
        </div>

        <div className="px-2 py-3 text-center">
          <p className="text-base font-semibold tabular-nums text-foreground">
            {setsCount}
          </p>
          <p className="mt-0.5 text-xs font-medium text-muted-foreground">
            Sets
          </p>
        </div>
      </section>

      {/* PRs */}
      {prList.length > 0 && (
        <section className="mt-5">
          <h2 className="mb-2 text-sm font-semibold text-foreground">PRs</h2>

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-card">
            {prList.map((pr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 border-b border-border px-3 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {pr.name}
                  </p>
                  <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
                    {pr.weight} {session.unit} × {pr.reps} reps
                  </p>
                </div>
                <PRBadge />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Exercises */}
      <section className="mt-5">
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Exercises
        </h2>

        <div className="space-y-2">
          {session.exercises.map((ex) => {
            const isExpanded = expandedExerciseIds.has(ex.id);

            const completedWorkingSets = ex.sets.filter(
              (set) => set.status === "completed" && set.type === "working",
            );

            const setSummary = completedWorkingSets
              .map((set) => `${set.weight ?? "—"} × ${set.reps ?? "—"}`)
              .join(", ");

            return (
              <div
                key={ex.id}
                className="overflow-hidden rounded-xl border border-border bg-card shadow-card"
              >
                <button
                  type="button"
                  onClick={() => toggleExerciseExpanded(ex.id)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left transition hover:bg-surface focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">
                      {ex.nameSnapshot}
                    </p>

                    <p className="mt-0.5 truncate text-sm tabular-nums text-muted-foreground">
                      {setSummary || "No completed working sets"}
                    </p>
                  </div>

                  <ChevronDown
                    className={`size-5 shrink-0 text-muted-foreground transition-transform ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isExpanded && (
                  <div className="border-t border-border bg-surface/40 px-3 py-3">
                    <div className="space-y-2">
                      {(() => {
                        let workingSetNumber = 0;
                        return ex.sets.map((set) => {
                          const isWarmup = set.type === "warmup";
                          const displayLabel = isWarmup
                            ? "W"
                            : String(++workingSetNumber);

                          return (
                            <div
                              key={set.id}
                              className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <span
                                  className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                                    isWarmup
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-primary/10 text-primary"
                                  }`}
                                >
                                  {displayLabel}
                                </span>

                                <span className="truncate text-sm font-semibold tabular-nums text-foreground">
                                  {set.weight ?? "—"} {session.unit} ×{" "}
                                  {set.reps ?? "—"}
                                </span>
                              </div>

                              <div className="flex shrink-0 items-center gap-2">
                                {set.isPr && <PRBadge />}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Notes */}
      {session.notes && (
        <section className="mt-5 rounded-xl border border-border bg-card p-3 shadow-card">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Notes
          </p>

          <p className="mt-2 text-sm leading-6 text-muted-foreground italic">
            “{session.notes}”
          </p>
        </section>
      )}

      {/* Done CTA */}
      <div className="sticky bottom-4 mt-auto pt-6">
        <ProductButton fullWidth onClick={() => navigate("/")}>
          Done
        </ProductButton>
      </div>
    </div>
  );
};

export default WorkoutSummaryPage;
