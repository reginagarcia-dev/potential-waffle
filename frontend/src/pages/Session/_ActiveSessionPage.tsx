import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.js";
import { useRestTimer } from "../../context/RestTimerContext.js";
import { ExerciseCard } from "../../components/ActiveSession/ExerciseCard.js";
import { ExerciseSearchSheet } from "../../components/ActiveSession/ExerciseSearchSheet.js";
import { SetEditSheet } from "../../components/ActiveSession/SetEditSheet.js";
import { FinishWorkoutSheet } from "../../components/ActiveSession/FinishWorkoutSheet.js";
import {
  ArrowLeft,
  Plus,
  CheckCircle2,
  MoreVertical,
  Ban,
  Pencil,
} from "lucide-react";
import { WorkoutSessionResponse, WorkoutSetResponse } from "shared";

export const ActiveSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { startTimer } = useRestTimer();

  // Dialog Overlays states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [editingWorkoutName, setEditingWorkoutName] = useState(false);
  const [tempWorkoutName, setTempWorkoutName] = useState("");

  // Currently focused set for the edit sheet
  const [activeSet, setActiveSet] = useState<WorkoutSetResponse | null>(null);

  // 1. Fetch active session query
  const {
    data: session,
    isLoading,
    error,
  } = useQuery<WorkoutSessionResponse>({
    queryKey: ["activeSession"],
    queryFn: () => apiFetch(`/sessions/${id}`),
    // Re-verify the session status, if it's completed, redirect to summary
    refetchOnWindowFocus: false,
  });

  // Redirect if session is already completed or abandoned
  useEffect(() => {
    if (session && session.status !== "active") {
      navigate(`/session/${session.id}/summary`);
    }
  }, [session, navigate]);

  // 2. Active Session Duration Timer (counts up in seconds)
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    if (!session || session.status !== "active") return;

    const startedTime = new Date(session.startedAt).getTime();

    const updateTimer = () => {
      const current = new Date().getTime();
      setElapsedSeconds(
        Math.max(0, Math.floor((current - startedTime) / 1000)),
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [session]);

  const formatElapsed = (totalSecs: number) => {
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    const mStr = m.toString().padStart(2, "0");
    const sStr = s.toString().padStart(2, "0");

    if (h > 0) {
      return `${h}:${mStr}:${sStr}`;
    }
    return `${mStr}:${sStr}`;
  };

  // 3. Consolidated Mutation Endpoint
  const mutation = useMutation({
    mutationFn: (payload: any) =>
      apiFetch(`/sessions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      }),
    onSuccess: (updatedSession) => {
      queryClient.setQueryData(["activeSession"], updatedSession);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
    },
  });

  // Action handlers
  const handleRenameSession = () => {
    if (tempWorkoutName.trim()) {
      mutation.mutate({ type: "rename_session", name: tempWorkoutName.trim() });
      setEditingWorkoutName(false);
    }
  };

  const handleAddExercise = (exerciseDefinitionId: string) => {
    mutation.mutate({ type: "add_exercise", exerciseDefinitionId });
  };

  const handleDeleteExercise = (exerciseId: string) => {
    mutation.mutate({ type: "delete_exercise", exerciseId });
  };

  const handleAddSet = (exerciseId: string, setType?: "warmup" | "working") => {
    mutation.mutate({ type: "add_set", exerciseId, setType });
  };

  const handleDeleteSet = (setId: string) => {
    mutation.mutate({ type: "delete_set", setId });
  };

  const handleTriggerSetEdit = (set: WorkoutSetResponse) => {
    setActiveSet(set);
    setIsEditOpen(true);
  };

  const handleConfirmSetEdit = (data: {
    weight: number | null;
    reps: number | null;
    rpe: number | null;
    type: "warmup" | "working";
  }) => {
    if (!activeSet) return;
    const { type: setType, ...rest } = data;
    mutation.mutate({
      type: "update_set",
      setId: activeSet.id,
      setType,
      ...rest,
    });
  };

  const handleToggleSetStatus = (set: WorkoutSetResponse) => {
    const nextStatus = set.status === "completed" ? "pending" : "completed";

    // Optimistically update database
    mutation.mutate({
      type: "update_set",
      setId: set.id,
      status: nextStatus,
    });

    // Trigger Rest Timer!
    // Start timer only when completing a working set
    if (nextStatus === "completed" && set.type === "working") {
      const restTime = user?.defaultRestSeconds || 180;

      // Look up next set info
      let nextSetMsg = "Next Set";
      if (session) {
        const parentExercise = session.exercises.find((ex) =>
          ex.sets.some((s) => s.id === set.id),
        );
        if (parentExercise) {
          const currentIdx = parentExercise.sets.findIndex(
            (s) => s.id === set.id,
          );
          if (
            currentIdx !== -1 &&
            currentIdx + 1 < parentExercise.sets.length
          ) {
            nextSetMsg = `${parentExercise.nameSnapshot} — Set ${currentIdx + 2}`;
          } else {
            nextSetMsg = "Next exercise";
          }
        }
      }

      startTimer(restTime, nextSetMsg);
    }
  };

  // 4. Finish Session Mutation
  const finishSessionMutation = useMutation({
    mutationFn: (notes: string) =>
      apiFetch(`/sessions/${id}/finish`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      }),
    onSuccess: () => {
      queryClient.setQueryData(["activeSession"], null);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      queryClient.invalidateQueries({ queryKey: ["recentSessions"] });
      navigate(`/session/${id}/summary`);
    },
  });

  // 5. Abandon Session Mutation
  const abandonSessionMutation = useMutation({
    mutationFn: () => apiFetch(`/sessions/${id}/abandon`, { method: "POST" }),
    onSuccess: () => {
      queryClient.setQueryData(["activeSession"], null);
      queryClient.invalidateQueries({ queryKey: ["activeSession"] });
      navigate("/");
    },
  });

  const handleAbandon = () => {
    if (
      confirm(
        "Are you sure you want to discard this workout? All unsaved logs will be lost.",
      )
    ) {
      abandonSessionMutation.mutate();
    }
  };

  if (
    isLoading ||
    abandonSessionMutation.isPending ||
    abandonSessionMutation.isSuccess ||
    finishSessionMutation.isPending ||
    finishSessionMutation.isSuccess
  ) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-teal-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-teal-500"></div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-bold text-red-400">
          Error loading workout
        </h3>
        <p className="text-zinc-500 mt-2">
          Workout session may not exist or has been deleted.
        </p>
        <button
          onClick={() => navigate("/")}
          className="mt-4 rounded-lg bg-zinc-900 border border-zinc-800 px-4 py-2 text-sm text-white"
        >
          Go Back Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/")}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {editingWorkoutName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={tempWorkoutName}
                onChange={(e) => setTempWorkoutName(e.target.value)}
                className="rounded border border-zinc-800 bg-zinc-950 px-2 py-1 text-sm font-bold text-white focus:border-teal-500 focus:outline-none"
              />
              <button
                onClick={handleRenameSession}
                className="rounded bg-teal-600 px-2.5 py-1 text-xs font-bold text-white"
              >
                Save
              </button>
            </div>
          ) : (
            <div>
              <h1 className="font-heading text-lg font-extrabold text-white flex items-center gap-1.5">
                {session.name}
                <button
                  onClick={() => {
                    setTempWorkoutName(session.name);
                    setEditingWorkoutName(true);
                  }}
                  className="text-zinc-500 hover:text-zinc-300"
                >
                  <Pencil className="h-3 w-3" />
                </button>
              </h1>
              <span className="font-mono text-xs font-semibold text-teal-400 tracking-wide">
                Timer: {formatElapsed(elapsedSeconds)}
              </span>
            </div>
          )}
        </div>

        {/* Options Context Menu */}
        <div className="relative">
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"
          >
            <MoreVertical className="h-4 w-4" />
          </button>

          {showOptions && (
            <div className="absolute right-0 mt-1.5 w-44 rounded-lg border border-zinc-850 bg-zinc-950 p-1 shadow-2xl z-40">
              <button
                onClick={() => {
                  setShowOptions(false);
                  handleAbandon();
                }}
                className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-xs font-semibold text-red-400 hover:bg-zinc-900"
              >
                <Ban className="h-3.5 w-3.5" />
                Discard Workout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Exercises Log Grid */}
      <div className="space-y-4">
        {session.exercises.length > 0 ? (
          session.exercises.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              unit={session.unit}
              onAddSet={handleAddSet}
              onToggleSetStatus={handleToggleSetStatus}
              onDeleteSet={handleDeleteSet}
              onDeleteExercise={handleDeleteExercise}
              onTriggerSetEdit={handleTriggerSetEdit}
            />
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-850 p-8 text-center bg-zinc-900/10">
            <p className="text-sm text-zinc-400">
              Workout is empty. Add exercises to start logging!
            </p>
          </div>
        )}
      </div>

      {/* Bottom Actions CTA */}
      <div className="space-y-3 pt-4">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-teal-900/60 bg-teal-950/15 py-3 text-sm font-bold text-teal-400 hover:bg-teal-950/30 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Exercise
        </button>

        <button
          type="button"
          onClick={() => setIsFinishOpen(true)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 text-sm font-bold text-white transition-colors hover:bg-teal-500 shadow-lg shadow-teal-950/20"
        >
          <CheckCircle2 className="h-4 w-4" />
          Finish Workout
        </button>
      </div>

      {/* Sheets / Overlays */}
      <ExerciseSearchSheet
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectExercise={handleAddExercise}
      />

      <SetEditSheet
        isOpen={isEditOpen}
        set={activeSet}
        unit={session.unit}
        onClose={() => {
          setIsEditOpen(false);
          setActiveSet(null);
        }}
        onConfirm={handleConfirmSetEdit}
      />

      <FinishWorkoutSheet
        isOpen={isFinishOpen}
        session={session}
        elapsedMinutes={Math.floor(elapsedSeconds / 60)}
        onClose={() => setIsFinishOpen(false)}
        onConfirm={(notes) => {
          setIsFinishOpen(false);
          finishSessionMutation.mutate(notes);
        }}
        isPending={finishSessionMutation.isPending}
      />
    </div>
  );
};
export default ActiveSessionPage;
