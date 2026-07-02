import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.js";
import {
  Search,
  Dumbbell,
  Award,
  TrendingUp,
  BarChart4,
  ChevronRight,
  Activity,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ExerciseDefinition, ProgressSummary } from "shared";

export const ProgressPage: React.FC = () => {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selectedExercise, setSelectedExercise] =
    useState<ExerciseDefinition | null>(null);

  const { data: exercises = [], isLoading: loadingLibrary } = useQuery<
    ExerciseDefinition[]
  >({
    queryKey: ["progressExercises", search],
    queryFn: () => apiFetch(`/exercises?q=${encodeURIComponent(search)}`),
  });

  const { data: progressData, isLoading: loadingProgress } =
    useQuery<ProgressSummary>({
      queryKey: ["exerciseProgress", selectedExercise?.id],
      queryFn: () => apiFetch(`/progress/${selectedExercise!.id}`),
      enabled: !!selectedExercise,
    });

  const chartData =
    progressData?.history.map((point) => ({
      ...point,
      formattedDate: new Date(point.date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    })) || [];

  return (
    <div className="space-y-6 px-4">
      <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 flex items-center justify-between border-b border-border bg-background px-4 pt-6 pb-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Analytics & Progress
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visualize your lifts over time
          </p>
        </div>
        {selectedExercise && (
          <button
            onClick={() => setSelectedExercise(null)}
            className="text-sm font-semibold text-primary transition hover:text-primary/80"
          >
            Change
          </button>
        )}
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
          {/* Active exercise header */}
          <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
            <div className="flex size-10 items-center justify-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
              <Dumbbell className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground">
                {selectedExercise.name}
              </h2>
              <span className="text-xs uppercase tracking-wider text-muted-foreground">
                {selectedExercise.muscleGroup}
              </span>
            </div>
          </div>

          {loadingProgress ? (
            <div className="h-64 animate-pulse rounded-xl border border-border bg-muted/30" />
          ) : progressData && chartData.length > 0 ? (
            <div className="space-y-6">
              {/* Highlight stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Award className="mx-auto size-4 text-accent" />
                  <span className="mt-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    All-Time Max Weight
                  </span>
                  <span className="mt-0.5 block text-xl font-semibold tabular-nums text-foreground">
                    {progressData.bestWeight
                      ? `${progressData.bestWeight} ${user?.preferredUnit ?? ""}`
                      : "—"}
                  </span>
                </div>

                <div className="rounded-xl border border-border bg-card p-4 text-center">
                  <Activity className="mx-auto size-4 animate-pulse text-primary" />
                  <span className="mt-1.5 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    All-Time Max Reps
                  </span>
                  <span className="mt-0.5 block text-xl font-semibold tabular-nums text-foreground">
                    {progressData.bestReps ? `${progressData.bestReps} reps` : "—"}
                  </span>
                </div>
              </div>

              {/* Max Weight Chart */}
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <TrendingUp className="size-4 text-primary" />
                  Max Weight Over Time
                </h3>
                <div className="h-56 w-full text-xs text-muted-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="formattedDate" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                        itemStyle={{ color: "hsl(var(--primary))" }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bestWeight"
                        name="Max Weight"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        activeDot={{ r: 6 }}
                        dot={{ r: 4, stroke: "hsl(var(--primary))", strokeWidth: 1 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Volume Chart */}
              <div className="space-y-3 rounded-xl border border-border bg-card p-4">
                <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <BarChart4 className="size-4 text-primary" />
                  Session Volume Trend
                </h3>
                <div className="h-56 w-full text-xs text-muted-foreground">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="formattedDate" stroke="hsl(var(--muted-foreground))" />
                      <YAxis stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))", fontWeight: "bold" }}
                        itemStyle={{ color: "hsl(var(--primary))" }}
                      />
                      <Bar
                        dataKey="volume"
                        name="Total Volume"
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

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
                        <span className="text-muted-foreground">{point.formattedDate}</span>
                        <div className="flex gap-4">
                          <span>
                            Best:{" "}
                            <span className="text-foreground">{point.bestWeight}</span>
                          </span>
                          <span>
                            Vol:{" "}
                            <span className="text-primary">{point.volume.toLocaleString()}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center">
              <TrendingUp className="mx-auto mb-3 size-8 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">No performance data yet</h4>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Once you complete workouts featuring this exercise, your progress charts will appear here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ProgressPage;
