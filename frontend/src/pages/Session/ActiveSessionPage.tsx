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
  MoreHorizontal,
  Pencil,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import { ProductButton } from "@/components/ui/ProductButton";
import { ExerciseCard } from "@/components/workout/ExerciseCard";
import { SetRow } from "@/components/workout/SetRow";
import { SetEditSheet } from "@/components/ActiveSession/SetEditSheet.js";
import { RestTimerBar } from "../../components/workout/RestTimerBar.js";
import { EditSetSheet } from "../../components/workout/EditSetSheet.js";
import { ExerciseSearchSheet as test } from "../../components/workout/ExerciseSearchSheet.js";
import { ExerciseSearchSheet } from "../../components/ActiveSession/ExerciseSearchSheet.js";
import { FinishWorkoutSheet } from "../../components/workout/FinishWorkoutSheet.js";
import { EllipsisMenu } from "@/components/ui/EllipsisMenu.js";

export function ActiveSessionPage() {
  const [isEditSetOpen, setIsEditSetOpen] = useState(false);
  const [isExerciseSearchOpen, setIsExerciseSearchOpen] = useState(false);
  const [isFinishOpen, setIsFinishOpen] = useState(false);

  const [weight, setWeight] = useState(140);
  const [reps, setReps] = useState(7);
  const [rpe, setRpe] = useState(9);
  const [isWarmup, setIsWarmup] = useState(false);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { startTimer } = useRestTimer();

  // Dialog Overlays states
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

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

  console.log(session?.exercises);
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
      <div className="flex flex-1 flex-col gap-4 px-4 py-5 pb-40">
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
                  className="field h-9 px-2 py-1 text-body font-semibold"
                />
                <button
                  onClick={handleRenameSession}
                  className="btn-primary h-9 px-3 text-caption"
                >
                  Save
                </button>
              </div>
            ) : (
              <h1 className="inline-flex items-center gap-1.5 font-display text-title font-semibold text-fg">
                {session?.name}
              </h1>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatElapsed(elapsedSeconds)}
            </span>

            <div className="relative">
              <EllipsisMenu
                ariaLabel="Open workout options"
                items={[
                  {
                    label: "Rename Workout",
                    icon: <Pencil className="size-4" />,
                    onClick: () => {},
                  },
                  {
                    label: "Workout Settings",
                    icon: <Settings className="size-4" />,
                    onClick: () => {},
                  },
                  {
                    label: "Add Workout Note",
                    icon: <FileText className="size-4" />,
                    onClick: () => {},
                  },
                  {
                    label: "Discard Workout",
                    icon: <Trash2 className="size-4" />,
                    destructive: true,
                    onClick: () => handleAbandon(),
                  },
                ]}
              />
            </div>
          </div>
        </header>
        {showOptions && (
          <div className="ui-card-tight absolute right-0 z-40 mt-1.5 w-44 p-1 shadow-float">
            <button
              onClick={() => {
                setShowOptions(false);
                handleAbandon();
              }}
              className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left text-label font-semibold text-danger transition hover:bg-surface"
            >
              <Ban className="h-3.5 w-3.5" />
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
                name={ex.nameSnapshot}
                // @ts-ignore
                // exercise={ex}
                // unit={session.unit}
                // onAddSet={handleAddSet}
                // onToggleSetStatus={handleToggleSetStatus}
                // onDeleteSet={handleDeleteSet}
                // onDeleteExercise={handleDeleteExercise}
                // onTriggerSetEdit={handleTriggerSetEdit}
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
        <ExerciseCard
          name="Squat"
          historyLabel="From Jun 21 · 135 x 8, 135 x 8, 135 x 7"
        >
          <SetRow
            setNumber={1}
            type="warmup"
            status="completed"
            previous="—"
            weight="45"
            reps="10"
            rpe="—"
            onClick={() => setIsEditSetOpen(true)}
          />

          <SetRow
            setNumber={1}
            status="completed"
            previous="135 x 8"
            weight="140"
            reps="8"
            rpe="8"
            onClick={() => setIsEditSetOpen(true)}
          />

          <SetRow
            setNumber={2}
            status="completed"
            previous="135 x 8"
            weight="140"
            reps="8"
            rpe="8"
            onClick={() => setIsEditSetOpen(true)}
          />

          <SetRow
            setNumber={3}
            status="pending"
            previous="135 x 7"
            weight="140"
            reps="7"
            rpe="9"
            onClick={() => setIsEditSetOpen(true)}
          />
        </ExerciseCard>
        {/* <ExerciseCard
          nameSnapshot="Romanian Deadlift"
          historyLabel="From Jun 19 · 95 x 10, 95 x 10, 95 x 9"
        >
          <SetRow
            setNumber={1}
            status="completed"
            previous="95 x 10"
            weight="100"
            reps="10"
            rpe="8"
          />

          <SetRow
            setNumber={2}
            status="pending"
            previous="95 x 10"
            weight="100"
            reps="10"
            rpe="8"
          />
        </ExerciseCard> */}
        <ProductButton
          fullWidth
          className="fixed inset-x-0 bottom-[5.25rem] z-30 mx-auto max-w-md px-4"
          onClick={() => setIsFinishOpen(true)}
        >
          Finish Workout
        </ProductButton>
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
        // @ts-ignore
        unit={session?.unit}
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

      <FinishWorkoutSheet
        isOpen={isFinishOpen}
        elapsedMinutes={Math.floor(elapsedSeconds / 60)}
        exercises={5}
        sets={18}
        volume="12,450 lbs"
        onClose={() => setIsFinishOpen(false)}
        onFinish={(notes) => {
          setIsFinishOpen(false);
          finishSessionMutation.mutate(notes);
        }}

        // session={session}
        // elapsedMinutes={Math.floor(elapsedSeconds / 60)}
        // onClose={() => setIsFinishOpen(false)}
        // onConfirm={(notes) => {
        //   setIsFinishOpen(false);
        //   finishSessionMutation.mutate(notes);
        // }}
        // isPending={finishSessionMutation.isPending}
      />
    </>
  );
}
