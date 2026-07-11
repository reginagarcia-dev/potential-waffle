import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext.js";
import { apiFetch } from "../../lib/api.js";
import { useRestTimerStore } from "../../stores/restTimerStore.js";
import { useSessionMutations } from "@/hooks/useSessionMutations";
import { WorkoutSessionResponse, WorkoutSetResponse, UpdateSetCommand } from "shared";
import {
  ArrowLeft,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
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
  const startTimer = useRestTimerStore((s) => s.startTimer);

  const {
    sessionQueryKey,
    mutation,
    toggleMutation,
    finishSessionMutation,
    abandonSessionMutation,
  } = useSessionMutations(id);

  // Dialog Overlays states
  const [isEditOpen, setIsEditOpen] = useState(false);

  const [editingWorkoutName, setEditingWorkoutName] = useState(false);
  const [tempWorkoutName, setTempWorkoutName] = useState("");

  // Currently focused set for the edit sheet
  const [activeSet, setActiveSet] = useState<WorkoutSetResponse | null>(null);

  // 1. Fetch active session query
  const { data: session } = useQuery<WorkoutSessionResponse>({
    queryKey: sessionQueryKey,
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

  const handleConfirmSetEdit = (
    data: Omit<UpdateSetCommand, "type" | "setId">,
  ) => {
    if (!activeSet) return;
    mutation.mutate({
      type: "update_set",
      setId: activeSet.id,
      ...data,
    });
  };

  const handleUpdateSetValue = (
    set: WorkoutSetResponse,
    field: "weight" | "reps",
    value: number | null,
  ) => {
    mutation.mutate(
      field === "weight"
        ? { type: "update_set", setId: set.id, weight: value }
        : { type: "update_set", setId: set.id, reps: value },
    );
  };

  const handleToggleSetStatus = (set: WorkoutSetResponse) => {
    const nextStatus = set.status === "completed" ? "pending" : "completed";

    toggleMutation.mutate({ setId: set.id, status: nextStatus });

    // Trigger Rest Timer!
    // Start timer only when completing a working set
    if (nextStatus === "completed" && set.type === "working") {
      const restTime = user?.defaultRestSeconds || 180;

      // Look up next set or next exercise
      let nextSetMsg: string | undefined;
      if (session) {
        const parentExerciseIdx = session.exercises.findIndex((ex) =>
          ex.sets.some((s) => s.id === set.id),
        );
        const parentExercise = session.exercises[parentExerciseIdx];
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
            const nextExercise = session.exercises[parentExerciseIdx + 1];
            nextSetMsg = nextExercise?.nameSnapshot;
          }
        }
      }

      startTimer(restTime, nextSetMsg);
    }
  };
  return (
    <>
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 pb-[calc(16rem+env(safe-area-inset-bottom))]">
        <header className="flex items-center justify-between gap-2">
          <button
            onClick={() => navigate("/")}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
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
              <h1
                className="block truncate text-lg font-semibold text-foreground"
                title={session?.name ?? "Workout"}
              >
                {session?.name}
              </h1>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {session && <SessionTimer startedAt={session.startedAt} />}

            <button
              onClick={() =>
                queryClient.invalidateQueries({ queryKey: sessionQueryKey })
              }
              className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              aria-label="Refresh session"
            >
              <RefreshCw className="size-4" />
            </button>

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
        <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 mx-auto w-full max-w-md px-4 pb-4">
          <div className="space-y-3">
            <RestTimerBar />

            <ProductButton fullWidth onClick={() => setIsFinishOpen(true)}>
              Finish Workout
            </ProductButton>
          </div>
        </div>
      </div>

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
          mutation.mutate({ type: "update_session_settings", ...settings });
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
          (Date.now() - new Date(session?.startedAt ?? Date.now()).getTime()) /
            60000,
        )}
        exercises={session?.exercises.length ?? 0}
        sets={
          session?.exercises.reduce(
            (acc, ex) =>
              acc +
              ex.sets.filter(
                (s) => s.status === "completed" && s.type !== "warmup",
              ).length,
            0,
          ) ?? 0
        }
        currentNote={session?.notes ?? ""}
        onClose={() => setIsFinishOpen(false)}
        onFinish={(notes) => {
          setIsFinishOpen(false);
          finishSessionMutation.mutate(
            notes === (session?.notes ?? "") ? undefined : notes,
          );
        }}
      />
    </>
  );
}
