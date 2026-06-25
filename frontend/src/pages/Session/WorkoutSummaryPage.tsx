import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import { Award, Clock, Dumbbell, Calendar, Flame } from "lucide-react";
import { WorkoutSessionResponse } from "shared";

export const WorkoutSummaryPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: session, isLoading } = useQuery<WorkoutSessionResponse>({
    queryKey: ["sessionSummary", id],
    queryFn: () => apiFetch(`/sessions/${id}`),
  });

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-brand">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand border-t-transparent"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="ui-card text-center">
        <h3 className="font-display text-title font-semibold text-danger">
          Workout not found
        </h3>
        <button onClick={() => navigate("/")} className="btn-ghost mt-4">
          Go Back Home
        </button>
      </div>
    );
  }

  // Calculate stats
  const durationMin =
    session.completedAt && session.startedAt
      ? Math.max(
          1,
          Math.round(
            (new Date(session.completedAt).getTime() -
              new Date(session.startedAt).getTime()) /
              60000,
          ),
        )
      : 0;

  const setsCount = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.length,
    0,
  );

  const totalVolume = session.exercises.reduce((acc, ex) => {
    return (
      acc +
      ex.sets.reduce((sum, s) => {
        if (
          s.status === "completed" &&
          s.type === "working" &&
          s.weight &&
          s.reps
        ) {
          return sum + s.weight * s.reps;
        }
        return sum;
      }, 0)
    );
  }, 0);

  // Extract PRs
  const prList: Array<{ name: string; weight: number; reps: number }> = [];
  session.exercises.forEach((ex) => {
    ex.sets.forEach((s) => {
      if (s.isPr && s.weight && s.reps) {
        prList.push({ name: ex.nameSnapshot, weight: s.weight, reps: s.reps });
      }
    });
  });

  return (
    <div className="app-screen !min-h-0 !px-0 !pt-0 !pb-12 space-y-6">
      {/* Title Header */}
      <div className="ui-card space-y-2 py-6 text-center">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-weak text-brand ring-4 ring-brand/10">
          <Flame className="h-6 w-6 fill-brand/20" />
        </div>
        <h1 className="font-display text-h1 font-bold tracking-tight text-fg">
          Workout Complete! 🎉
        </h1>
        <p className="text-body-sm font-semibold uppercase tracking-wider text-fg-secondary">
          {session.name}
        </p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="ui-card-tight text-center">
          <Clock className="mx-auto h-5 w-5 text-fg-dim" />
          <span className="mt-2 block text-caption font-semibold uppercase tracking-wider text-fg-dim">
            Duration
          </span>
          <span className="mt-0.5 block font-display text-title font-semibold text-fg">
            {durationMin} min
          </span>
        </div>

        <div className="ui-card-tight text-center">
          <Dumbbell className="mx-auto h-5 w-5 text-fg-dim" />
          <span className="mt-2 block text-caption font-semibold uppercase tracking-wider text-fg-dim">
            Exercises
          </span>
          <span className="mt-0.5 block font-display text-title font-semibold text-fg">
            {session.exercises.length}
          </span>
        </div>

        <div className="ui-card-tight text-center">
          <Calendar className="mx-auto h-5 w-5 text-fg-dim" />
          <span className="mt-2 block text-caption font-semibold uppercase tracking-wider text-fg-dim">
            Sets Logged
          </span>
          <span className="mt-0.5 block font-display text-title font-semibold text-fg">
            {setsCount}
          </span>
        </div>

        <div className="ui-card-tight text-center">
          <Award className="mx-auto h-5 w-5 text-fg-dim" />
          <span className="mt-2 block text-caption font-semibold uppercase tracking-wider text-fg-dim">
            Volume ({session.unit})
          </span>
          <span className="mt-0.5 block font-display text-title font-semibold text-brand">
            {totalVolume.toLocaleString()}
          </span>
        </div>
      </div>

      {/* PR accomplishments */}
      {prList.length > 0 && (
        <div className="ui-card space-y-2.5 border-warning/40 bg-warning/10">
          <h3 className="inline-flex items-center gap-1.5 font-display text-label font-semibold uppercase tracking-wider text-warning">
            <Award className="h-4 w-4 fill-warning/10" />
            Personal Records Set
          </h3>
          <div className="space-y-1">
            {prList.map((pr, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-body font-semibold text-fg"
              >
                <span className="text-fg-secondary">{pr.name}</span>
                <span className="text-warning">
                  {pr.weight} {session.unit} × {pr.reps} reps
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Detail Review */}
      <div className="space-y-3">
        <h3 className="font-display text-label font-semibold uppercase tracking-wider text-fg-secondary">
          Exercise Summary
        </h3>

        <div className="space-y-2">
          {session.exercises.map((ex) => (
            <div key={ex.id} className="ui-card-tight flex flex-col gap-2">
              <span className="text-body font-semibold text-fg">
                {ex.nameSnapshot}
              </span>

              <div className="flex flex-wrap gap-1.5">
                {ex.sets.map((set, sIdx) => (
                  <span
                    key={set.id}
                    className={`inline-flex items-center gap-1 rounded-sm px-2 py-1 text-caption font-semibold ${
                      set.type === "warmup"
                        ? "bg-surface text-fg-dim"
                        : "bg-surface-2/70 text-fg-secondary"
                    }`}
                  >
                    {set.type === "warmup" ? "W" : sIdx + 1}
                    {": "}
                    {set.weight}×{set.reps}
                    {set.isPr && (
                      <span className="font-black text-warning">★</span>
                    )}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workout Notes */}
      {session.notes && (
        <div className="ui-card-tight space-y-2">
          <span className="block text-caption font-semibold uppercase tracking-wider text-fg-dim">
            Notes
          </span>
          <p className="text-body text-fg-secondary italic">
            "{session.notes}"
          </p>
        </div>
      )}

      {/* Action CTA */}
      <button onClick={() => navigate("/")} className="btn-primary-wide">
        Done
      </button>
    </div>
  );
};
export default WorkoutSummaryPage;
