import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext.js";
import { apiFetch } from "../../lib/api.js";
import { useRestTimer } from "../../context/RestTimerContext.js";
import { WorkoutSessionResponse, WorkoutSetResponse } from "shared";
import {
  ArrowLeft,
  Ban,
  FileText,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import RenameWorkoutSheet from "@/components/ActiveSession/RenameWorkoutSheet";
import WorkoutSettingsSheet from "@/components/ActiveSession/WorkoutSettingsSheet";
import WorkoutNoteSheet from "@/components/ActiveSession/WorkoutNoteSheet";
import DiscardWorkoutSheet from "@/components/ActiveSession/DiscardWorkoutSheet";
import { ProductButton } from "@/components/ui/ProductButton";
import { ExerciseCard } from "@/components/ActiveSession/ExerciseCard";
import { SetEditSheet } from "@/components/ActiveSession/SetEditSheet.js";
import RestTimerBar from "@/components/ActiveSession/RestTimerBar";
import { ExerciseSearchSheet } from "../../components/ActiveSession/ExerciseSearchSheet.js";
import { FinishWorkoutSheet } from "../../components/workout/FinishWorkoutSheet.js";
import { EllipsisMenu } from "@/components/ui/EllipsisMenu.js";
import { SessionTimer } from "@/components/ActiveSession/SessionTimer";
export function ActiveSessionPage() {
  const [isExerciseSearchOpen, setIsExerciseSearchOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [isDiscardOpen, setIsDiscardOpen] = useState(false);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { startTimer } = useRestTimer();

  // Dialog Overlays states
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [showOptions, setShowOptions] = useState(false);
  const [editingWorkoutName, setEditingWorkoutName] = useState(false);
  const [tempWorkoutName, setTempWorkoutName] = useState("");

  // Currently focused set for the edit sheet
  const [activeSet, setActiveSet] = useState<WorkoutSetResponse | null>(null);

  // 1. Fetch active session query
  const { data: session } = useQuery<WorkoutSessionResponse>({
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

  const handleUpdateSetValue = (
    set: WorkoutSetResponse,
    field: "weight" | "reps",
    value: number | null,
  ) => {
    mutation.mutate({
      type: "update_set",
      setId: set.id,
      [field]: value,
    });
  };

  const handleApplySuggestion = (exerciseId: string, weight: number, reps: number | null) => {
    mutation.mutate({ type: "apply_overload_suggestion", exerciseId, weight, reps });
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
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 pb-56">
        <header className="flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="text-center">
            {editingWorkoutName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={tempWorkoutName}
                  onChange={(e) => setTempWorkoutName(e.target.value)}
                  className="h-9 w-full rounded-md border border-border bg-surface px-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
                <button
                  onClick={handleRenameSession}
                  className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                  Save
                </button>
              </div>
            ) : (
              <h1 className="inline-flex items-center gap-1.5 text-lg font-semibold text-foreground">
                {session?.name}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            {session && <SessionTimer startedAt={session.startedAt} />}

            <div className="relative">
              <EllipsisMenu
                ariaLabel="Open workout options"
                items={[
                  {
                    label: "Rename Workout",
                    icon: <Pencil className="size-4" />,
                    onClick: () => setIsRenameOpen(true),
                  },
                  {
                    label: "Workout Settings",
                    icon: <Settings className="size-4" />,
                    onClick: () => setIsSettingsOpen(true),
                  },
                  {
                    label: "Add Workout Note",
                    icon: <FileText className="size-4" />,
                    onClick: () => setIsNoteOpen(true),
                  },
                  {
                    label: "Discard Workout",
                    icon: <Trash2 className="size-4 text-danger" />,
                    destructive: true,
                    onClick: () => setIsDiscardOpen(true),
                  },
                ]}
              />
            </div>
          </div>
        </header>
        {showOptions && (
          <div className="absolute right-0 z-40 mt-1.5 w-44 rounded-xl border border-border bg-card p-1 shadow-card">
            <button
              onClick={() => {
                setShowOptions(false);
                handleAbandon();
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs font-semibold text-danger transition hover:bg-surface"
            >
              <Ban className="size-4" />
              Discard Workout
            </button>
          </div>
        )}
        <ProductButton
          variant="secondary"
          fullWidth
          className="border-primary/40 text-primary hover:bg-primary/10"
          onClick={() => setIsExerciseSearchOpen(true)}
        >
          <Plus className="mr-2 size-4" />
          Add Exercise
        </ProductButton>
        <div className="space-y-4">
          {Array.isArray(session?.exercises) && session.exercises.length > 0 ? (
            session?.exercises.map((ex) => (
              <ExerciseCard
                key={ex.id}
                exercise={ex}
                unit={session.unit}
                onAddSet={handleAddSet}
                onToggleSetStatus={handleToggleSetStatus}
                onDeleteSet={handleDeleteSet}
                onDeleteExercise={handleDeleteExercise}
                onTriggerSetEdit={handleTriggerSetEdit}
                onUpdateSetValue={handleUpdateSetValue}
                onApplySuggestion={handleApplySuggestion}
              />
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-muted/10 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Workout is empty. Add exercises to start logging!
              </p>
            </div>
          )}
        </div>
        {/* <ProductButton
          fullWidth
          className="fixed inset-x-0 bottom-21 z-30 mx-auto max-w-md px-4"
          onClick={() => setIsFinishOpen(true)}
        >
          Finish Workout
        </ProductButton> */}
        <div className="fixed inset-x-0 bottom-16 z-30 mx-auto w-full max-w-md px-4 pb-4">
          <div className="space-y-3">
            <RestTimerBar />

            <ProductButton fullWidth onClick={() => setIsFinishOpen(true)}>
              Finish Workout
            </ProductButton>
          </div>
        </div>
      </div>

      {/* <RestTimerBar timeRemaining="01:42" nextLabel="Squat — Set 3" /> */}

      {/* <EditSetSheet
        open={isEditSetOpen}
        setLabel="Set 3"
        previous="135 x 7"
        weight={weight}
        reps={reps}
        rpe={rpe}
        isWarmup={isWarmup}
        onClose={() => setIsEditSetOpen(false)}
        onConfirm={() => setIsEditSetOpen(false)}
        onWeightChange={setWeight}
        onRepsChange={setReps}
        onRpeChange={setRpe}
        onWarmupChange={setIsWarmup}
      /> */}
      <SetEditSheet
        isOpen={isEditOpen}
        set={activeSet}
        unit={session?.unit ?? "lbs"}
        onClose={() => {
          setIsEditOpen(false);
          setActiveSet(null);
        }}
        onConfirm={handleConfirmSetEdit}
      />
      <ExerciseSearchSheet
        isOpen={isExerciseSearchOpen}
        onClose={() => setIsExerciseSearchOpen(false)}
        onSelectExercise={handleAddExercise}
      />
      <RenameWorkoutSheet
        isOpen={isRenameOpen}
        currentName={session?.name ?? ""}
        onClose={() => setIsRenameOpen(false)}
        onSave={(name) => {
          mutation.mutate({ type: "rename_session", name });
          setIsRenameOpen(false);
        }}
        isPending={mutation.isPending}
      />

      <WorkoutSettingsSheet
        isOpen={isSettingsOpen}
        unit={session?.unit ?? "lbs"}
        defaultRestSeconds={user?.defaultRestSeconds ?? 180}
        onClose={() => setIsSettingsOpen(false)}
        onSave={(settings) => {
          mutation.mutate({
            type: "update_session_settings",
            unit: settings.unit,
            defaultRestSeconds: settings.defaultRestSeconds,
          });
          setIsSettingsOpen(false);
        }}
        isPending={mutation.isPending}
      />

      <WorkoutNoteSheet
        isOpen={isNoteOpen}
        currentNote={session?.notes ?? ""}
        onClose={() => setIsNoteOpen(false)}
        onSave={(note) => {
          mutation.mutate({
            type: "update_session_notes",
            notes: note,
          });
          setIsNoteOpen(false);
        }}
        isPending={mutation.isPending}
      />

      <DiscardWorkoutSheet
        isOpen={isDiscardOpen}
        workoutName={session?.name}
        onClose={() => setIsDiscardOpen(false)}
        onDiscard={() => {
          setIsDiscardOpen(false);
          abandonSessionMutation.mutate();
        }}
        isPending={abandonSessionMutation.isPending}
      />
      <FinishWorkoutSheet
        isOpen={isFinishOpen}
        elapsedMinutes={Math.floor(
          (Date.now() - new Date(session?.startedAt ?? Date.now()).getTime()) / 60000
        )}
        exercises={session?.exercises.length ?? 0}
        sets={
          session?.exercises.reduce(
            (acc, ex) =>
              acc + ex.sets.filter((s) => s.status === "completed").length,
            0,
          ) ?? 0
        }
        volume={(() => {
          const vol =
            session?.exercises.reduce(
              (acc, ex) =>
                acc +
                ex.sets.reduce((sum, s) => {
                  if (
                    s.status === "completed" &&
                    s.type === "working" &&
                    s.weight &&
                    s.reps
                  )
                    return sum + s.weight * s.reps;
                  return sum;
                }, 0),
              0,
            ) ?? 0;
          return `${vol.toLocaleString()} ${session?.unit ?? "lbs"}`;
        })()}
        onClose={() => setIsFinishOpen(false)}
        onFinish={(notes) => {
          setIsFinishOpen(false);
          finishSessionMutation.mutate(notes);
        }}
      />
    </>
  );
}
