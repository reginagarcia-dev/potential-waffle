import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import {
  ArrowLeft,
  Clock,
  Dumbbell,
  Calendar,
  FileText,
  Pencil,
  Trash2,
} from "lucide-react";
import { PRBadge } from "@/components/workout/PRBadge";
import RenameWorkoutSheet from "@/components/ActiveSession/RenameWorkoutSheet";
import WorkoutNoteSheet from "@/components/ActiveSession/WorkoutNoteSheet";
import DiscardWorkoutSheet from "@/components/ActiveSession/DiscardWorkoutSheet";
import { EllipsisMenu } from "@/components/ui/EllipsisMenu";
import { WorkoutSessionResponse } from "shared";
import { withSetLabels } from "@/lib/setLabels";
import { Spinner } from "@/components/ui/Spinner";
import { MetricCard } from "@/components/ui/MetricCard";
import { getSessionDurationMinutes } from "@/lib/session";

export const PastSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

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

  const updateSessionMutation = useMutation({
    mutationFn: (
      payload:
        | { type: "rename_session"; name: string }
        | { type: "update_session_notes"; notes: string },
    ) =>
      apiFetch(`/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["pastSession", id], updatedSession);
      queryClient.invalidateQueries({ queryKey: ["workoutHistory"] });
      queryClient.invalidateQueries({ queryKey: ["recentSessions"] });
      queryClient.invalidateQueries({ queryKey: ["sessionSummary", id] });
    },
  });

  if (isLoading || deleteMutation.isPending || deleteMutation.isSuccess) {
    return <Spinner variant="page" />;
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

  const durationMin = getSessionDurationMinutes(session) ?? 0;

  const setsCount = session.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter((s) => s.type === "working").length,
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

        <EllipsisMenu
          ariaLabel="Open workout options"
          items={[
            {
              label: "Rename Workout",
              icon: <Pencil className="size-4" />,
              onClick: () => setIsRenameOpen(true),
              disabled:
                updateSessionMutation.isPending || deleteMutation.isPending,
            },
            {
              label: "Add Workout Note",
              icon: <FileText className="size-4" />,
              onClick: () => setIsNoteOpen(true),
              disabled:
                updateSessionMutation.isPending || deleteMutation.isPending,
            },
            {
              label: "Discard Workout",
              icon: <Trash2 className="size-4 text-danger" />,
              destructive: true,
              onClick: () => setIsDiscardOpen(true),
              disabled: deleteMutation.isPending,
            },
          ]}
        />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          icon={<Clock className="size-5 text-primary" />}
          label="Duration"
          value={`${durationMin} min`}
        />
        <MetricCard
          icon={<Dumbbell className="size-5 text-primary" />}
          label="Exercises"
          value={String(session.exercises.length)}
        />
        <MetricCard
          icon={<Calendar className="size-5 text-primary" />}
          label="Sets Logged"
          value={String(setsCount)}
        />
        <MetricCard
          icon={<PRBadge className="size-7 p-1" />}
          label="PRs"
          value={String(prCount)}
        />
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
                  {withSetLabels(ex.sets).map(({ set, label }) => (
                    <div
                      key={set.id}
                      className="grid grid-cols-3 border-b border-border/40 py-1.5 text-sm text-foreground last:border-0"
                    >
                      <span className="flex items-center gap-3 text-muted-foreground">
                        {label}
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
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <RenameWorkoutSheet
        isOpen={isRenameOpen}
        currentName={session.name}
        onClose={() => setIsRenameOpen(false)}
        onSave={(name) => {
          updateSessionMutation.mutate({ type: "rename_session", name });
          setIsRenameOpen(false);
        }}
        isPending={updateSessionMutation.isPending}
      />

      <WorkoutNoteSheet
        isOpen={isNoteOpen}
        currentNote={session.notes}
        onClose={() => setIsNoteOpen(false)}
        onSave={(notes) => {
          updateSessionMutation.mutate({ type: "update_session_notes", notes });
          setIsNoteOpen(false);
        }}
        isPending={updateSessionMutation.isPending}
      />

      <DiscardWorkoutSheet
        isOpen={isDiscardOpen}
        workoutName={session.name}
        onClose={() => setIsDiscardOpen(false)}
        onDiscard={() => {
          setIsDiscardOpen(false);
          deleteMutation.mutate();
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
};
export default PastSessionPage;
