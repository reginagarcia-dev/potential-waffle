import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  ArrowLeft,
  Search,
  Dumbbell,
  TrendingUp,
  ChevronRight,
  Activity,
} from "lucide-react";
import { PRBadge } from "@/components/workout/PRBadge";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyStateCard } from "@/components/ui/EmptyStateCard";
import { ProductButton } from "@/components/ui/ProductButton";
import { ExerciseProgressChart } from "@/components/Progress/ExerciseProgressChart";
import { ExerciseDefinition, ProgressSummary } from "shared";
import { formatShortDate } from "@/lib/dates";

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseDefinition | null>(null);

  const {
    data: exercises = [],
    isLoading: loadingLibrary,
    isError: errorLibrary,
    refetch: refetchLibrary,
  } = useQuery<ExerciseDefinition[]>({
    queryKey: ["progressExercises", search],
    queryFn: () => apiFetch(`/exercises?q=${encodeURIComponent(search)}`),
  });

  const {
    data: progressData,
    isLoading: loadingProgress,
    isError: errorProgress,
    refetch: refetchProgress,
  } = useQuery<ProgressSummary>({
    queryKey: ["exerciseProgress", selectedExercise?.id],
    queryFn: () => apiFetch(`/progress/${selectedExercise!.id}`),
    enabled: !!selectedExercise,
  });

  const chartData =
    progressData?.history.map((point) => ({
      ...point,
      formattedDate: formatShortDate(point.date),
    })) || [];

  return (
    <div className="space-y-6 px-4">
      <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 flex items-center border-b border-border bg-background px-4 pt-6 pb-4 gap-3">
        {selectedExercise && (
          <button
            onClick={() => setSelectedExercise(null)}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {selectedExercise ? selectedExercise.name : "Progress"}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedExercise
              ? selectedExercise.muscleGroup?.toUpperCase()
              : "Visualize your lifts over time"}
          </p>
        </div>
      </div>

      {!selectedExercise ? (
        <div className="space-y-4">
          {/* Search */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
              <Search className="size-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercise to view charts..."
              className="block h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {/* Exercise list */}
          {loadingLibrary ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading exercise library...
            </div>
          ) : errorLibrary ? (
            <EmptyStateCard
              icon={<Search className="size-8 text-muted-foreground" />}
              title="Couldn't load exercises"
              description="Check your connection and try again."
              action={
                <ProductButton fullWidth onClick={() => refetchLibrary()}>
                  Retry
                </ProductButton>
              }
            />
          ) : exercises.length > 0 ? (
            <div className="space-y-2">
              {exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExercise(ex)}
                  className="group flex w-full items-center justify-between rounded-xl border border-border bg-card p-4 text-left transition-all hover:border-border/70 hover:bg-surface"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-lg border border-border bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                      <Dumbbell className="size-4" />
                    </div>
                    <div>
                      <span className="block text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                        {ex.name}
                      </span>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">
                        {ex.muscleGroup}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No exercises found.
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {loadingProgress ? (
            <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
          ) : errorProgress ? (
            <EmptyStateCard
              icon={<TrendingUp className="size-8 text-muted-foreground" />}
              title="Couldn't load progress"
              description="Check your connection and try again."
              action={
                <ProductButton fullWidth onClick={() => refetchProgress()}>
                  Retry
                </ProductButton>
              }
            />
          ) : progressData && chartData.length > 0 ? (
            <div className="space-y-6">
              {/* Highlight stats */}
              <div className="grid grid-cols-2 gap-3">
                <MetricCard
                  icon={<PRBadge className="size-6 p-1" />}
                  label="All-Time Max Weight"
                  value={
                    progressData.bestWeight
                      ? `${progressData.bestWeight} ${user?.preferredUnit ?? ""}`
                      : "—"
                  }
                />
                <MetricCard
                  icon={
                    <Activity className="size-4 animate-pulse text-primary" />
                  }
                  label="All-Time Max Reps"
                  value={
                    progressData.bestReps
                      ? `${progressData.bestReps} reps`
                      : "—"
                  }
                />
              </div>

              {/* Max Weight Chart */}
              <ExerciseProgressChart data={chartData} />

              {/* History table */}
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Workout History Log
                </h3>
                <div className="space-y-2">
                  {chartData
                    .slice()
                    .reverse()
                    .map((point, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between border-b border-border/40 py-2 text-sm font-semibold text-foreground last:border-0"
                      >
                        <span className="text-muted-foreground">
                          {point.formattedDate}
                        </span>
                        <span>
                          Best:{" "}
                          <span className="text-foreground">
                            {point.bestWeight}
                          </span>
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyStateCard
              className="bg-card/50 p-12"
              icon={<TrendingUp className="size-8 text-muted-foreground" />}
              title="No performance data yet"
              description="Once you complete workouts featuring this exercise, your progress charts will appear here."
            />
          )}
        </div>
      )}
    </div>
  );
};
export default ProgressPage;
