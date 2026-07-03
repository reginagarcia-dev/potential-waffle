import React, { useRef, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import {
  AlertTriangle,
  ArrowLeft,
  Clock,
  Dumbbell,
  Calendar,
  Award,
  Trash2,
  X,
} from "lucide-react";
import { PRBadge } from "@/components/workout/PRBadge";
import { WorkoutSessionResponse } from "shared";

export const PastSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const deleteDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dialog = deleteDialogRef.current;
    if (!dialog) return;
    if (isDeleteOpen && !dialog.open) {
      dialog.showModal();
    } else if (!isDeleteOpen && dialog.open) {
      dialog.close();
    }
  }, [isDeleteOpen]);

  const {
    data: session,
    isLoading,
    error,
  } = useQuery<WorkoutSessionResponse>({
    queryKey: ["pastSession", id],
    queryFn: () => apiFetch(`/sessions/${id}`),
  });

  const deleteMutation = useMutation({
    mutationFn: () => apiFetch(`/sessions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workoutHistory"] });
      queryClient.invalidateQueries({ queryKey: ["recentSessions"] });
      navigate("/history");
    },
  });

  if (isLoading || deleteMutation.isPending || deleteMutation.isSuccess) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="px-4 py-12 text-center">
        <h3 className="text-lg font-semibold text-danger">Workout not found</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          This workout record may have been deleted.
        </p>
        <button
          onClick={() => navigate("/history")}
          className="mt-4 inline-flex h-11 items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted/60"
        >
          Back to History
        </button>
      </div>
    );
  }

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

  const prCount = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.isPr).length,
    0,
  );

  const formattedDate = new Date(
    session.completedAt || session.startedAt,
  ).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="space-y-6 px-4 py-5">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/history")}
            className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {session.name}
            </h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {formattedDate}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDeleteOpen(true)}
          className="inline-flex size-10 items-center justify-center rounded-full text-danger/70 transition hover:bg-danger/10 hover:text-danger"
        >
          <Trash2 className="size-5" />
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Clock className="mx-auto size-5 text-muted-foreground" />
          <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Duration
          </span>
          <span className="mt-1 block text-xl font-semibold tabular-nums text-foreground">
            {durationMin} min
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Dumbbell className="mx-auto size-5 text-muted-foreground" />
          <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Exercises
          </span>
          <span className="mt-1 block text-xl font-semibold tabular-nums text-foreground">
            {session.exercises.length}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Calendar className="mx-auto size-5 text-muted-foreground" />
          <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Sets Logged
          </span>
          <span className="mt-1 block text-xl font-semibold tabular-nums text-foreground">
            {setsCount}
          </span>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <Award className="mx-auto size-5 text-muted-foreground" />
          <span className="mt-2 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            PRs
          </span>
          <span className="mt-1 block text-xl font-semibold tabular-nums text-primary">
            {prCount}
          </span>
        </div>
      </div>

      {/* Workout Notes */}
      {session.notes && (
        <div className="space-y-1 rounded-xl border border-border bg-card p-4">
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Workout Notes
          </span>
          <p className="text-sm italic text-muted-foreground">
            "{session.notes}"
          </p>
        </div>
      )}

      {/* Exercise Log */}
      <div className="space-y-4">
        <h3 className="pl-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Workout Details
        </h3>

        <div className="space-y-3">
          {session.exercises.map((ex) => (
            <div
              key={ex.id}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <span className="block text-sm font-semibold text-foreground">
                {ex.nameSnapshot}
              </span>

              <div className="space-y-2">
                <div className="grid grid-cols-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <span>Set</span>
                  <span className="text-right">Weight</span>
                  <span className="text-right">Reps</span>
                  {/* <span className="text-right">RPE</span> */}
                </div>

                <div className="space-y-1">
                  {(() => {
                    let workingCount = 0;
                    return ex.sets.map((set) => {
                      const setLabel =
                        set.type === "warmup" ? "W" : String(++workingCount);
                      return (
                        <div
                          key={set.id}
                          className="grid grid-cols-3 border-b border-border/40 py-1.5 text-sm text-foreground last:border-0"
                        >
                          <span className="flex items-center gap-3 text-muted-foreground">
                            {setLabel}
                            {set.isPr && <PRBadge className="size-5 p-0.5" />}
                          </span>
                          <span className="text-right">
                            {set.weight}{" "}
                            <span className="text-xs text-muted-foreground">
                              {session.unit}
                            </span>
                          </span>
                          <span className="text-right">
                            {set.reps}{" "}
                            <span className="text-xs text-muted-foreground">
                              reps
                            </span>
                          </span>
                          {/* <span className="text-right text-primary">
                            {set.rpe ? `@${set.rpe}` : '—'}
                          </span> */}
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Delete workout confirmation */}
      <dialog
        ref={deleteDialogRef}
        onClose={() => setIsDeleteOpen(false)}
        className="m-auto w-[min(100%-2rem,26rem)] max-w-md rounded-2xl border border-border bg-card p-0 text-foreground shadow-elevated backdrop:bg-black/60 backdrop:backdrop-blur-sm overflow-hidden focus:outline-none"
      >
        <div className="px-5 pt-4">
          <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-muted" />

          <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
            <div className="flex gap-3">
              <div className="inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-danger/30 bg-danger/10 text-danger">
                <AlertTriangle className="size-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                  Delete Workout?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  This will permanently delete{" "}
                  <span className="font-semibold text-foreground">
                    {session.name}
                  </span>{" "}
                  from your history.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDeleteOpen(false)}
              aria-label="Close"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3 px-5 py-5">
          <button
            type="button"
            disabled={deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-danger px-4 text-base font-semibold text-primary-foreground transition hover:bg-danger/90 active:bg-danger/80 disabled:pointer-events-none disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Workout"}
          </button>

          <button
            type="button"
            onClick={() => setIsDeleteOpen(false)}
            className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-foreground transition hover:bg-muted/60 focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Keep Workout
          </button>
        </div>
      </dialog>
    </div>
  );
};
export default PastSessionPage;
