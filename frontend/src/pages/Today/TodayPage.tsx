import React from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.js";
import { Play, Dumbbell, Award, ArrowRight, Calendar } from "lucide-react";
import { WorkoutSessionResponse } from "shared";

export const TodayPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Fetch active session
  const { data: activeSession, isLoading: loadingActive } =
    useQuery<WorkoutSessionResponse | null>({
      queryKey: ["activeSession"],
      queryFn: () => apiFetch("/sessions/active"),
    });

  // 2. Fetch completed sessions (limit 5 for today view)
  const { data: recentSessions, isLoading: loadingRecent } = useQuery<
    WorkoutSessionResponse[]
  >({
    queryKey: ["recentSessions"],
    queryFn: () => apiFetch("/sessions?page=1&limit=5"),
  });

  // 3. Extract recent PRs from the completed sessions
  const recentPrs: Array<{
    exerciseName: string;
    weight: number;
    unit: string;
    date: string;
  }> = [];
  if (recentSessions) {
    recentSessions.forEach((session) => {
      session.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.isPr && set.weight) {
            recentPrs.push({
              exerciseName: ex.nameSnapshot,
              weight: set.weight,
              unit: session.unit,
              date: new Date(session.completedAt || "").toLocaleDateString(
                undefined,
                { month: "short", day: "numeric" },
              ),
            });
          }
        });
      });
    });
  }

  const handleStartWorkout = () => {
    navigate("/session/new");
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white">
          Today
        </h1>
        <p className="text-sm text-zinc-400">
          {getGreeting()}, {user?.email.split("@")[0]} 👋
        </p>
      </div>

      {/* Active Workout Banner OR Start Workout CTA */}
      {loadingActive ? (
        <div className="h-32 animate-pulse rounded-xl bg-zinc-900 border border-zinc-800" />
      ) : activeSession ? (
        <div className="rounded-xl border border-teal-800/80 bg-gradient-to-br from-zinc-900 via-teal-950/20 to-zinc-950 p-5 shadow-lg">
          <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-xs font-semibold text-teal-400 border border-teal-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-teal-400 animate-ping"></span>
            Workout in progress
          </span>
          <h3 className="mt-3 font-heading text-xl font-bold text-white">
            {activeSession.name}
          </h3>
          <p className="mt-1 text-sm text-zinc-400">
            {activeSession.exercises.length} exercises ·{" "}
            {activeSession.exercises.reduce(
              (total, ex) => total + ex.sets.length,
              0,
            )}{" "}
            sets logged
          </p>
          <button
            onClick={() => navigate(`/session/${activeSession.id}`)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-500"
          >
            <Play className="h-4 w-4 fill-white" />
            Resume Workout
          </button>
        </div>
      ) : (
        <button
          onClick={handleStartWorkout}
          className="flex w-full items-center justify-between rounded-xl border border-zinc-800 bg-zinc-900/60 p-5 text-left transition-all hover:bg-zinc-900 hover:border-teal-900"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-600/10 text-teal-400 border border-teal-500/20">
              <Dumbbell className="h-6 w-6" />
            </div>
            <div>
              <h3 className="font-heading text-lg font-bold text-white">
                Start Workout
              </h3>
              <p className="text-xs text-zinc-400">
                Begin an empty custom session
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-zinc-500" />
        </button>
      )}

      {/* Recent PRs Showcase */}
      {recentPrs.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Recent Personal Records
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
            {recentPrs.slice(0, 5).map((pr, idx) => (
              <div
                key={idx}
                className="flex-shrink-0 w-44 rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5"
              >
                <span className="inline-flex rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-extrabold text-amber-400 border border-amber-500/20">
                  NEW PR
                </span>
                <h4 className="mt-2 truncate text-sm font-semibold text-white">
                  {pr.exerciseName}
                </h4>
                <p className="mt-1 font-heading text-lg font-bold text-teal-400">
                  {pr.weight} {pr.unit}
                </p>
                <span className="text-[10px] text-zinc-500">{pr.date}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Workouts */}
      <div className="space-y-3">
        <h2 className="font-heading text-lg font-bold text-white flex items-center gap-2">
          <Calendar className="h-5 w-5 text-zinc-400" />
          Recent Workouts
        </h2>

        {loadingRecent ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-xl bg-zinc-900 border border-zinc-800"
              />
            ))}
          </div>
        ) : recentSessions && recentSessions.length > 0 ? (
          <div className="space-y-3">
            {recentSessions.map((session) => (
              <div
                key={session.id}
                onClick={() => navigate(`/history/${session.id}`)}
                className="group flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-900/20 p-4 transition-all hover:bg-zinc-900/40 hover:border-zinc-800 cursor-pointer"
              >
                <div className="space-y-1">
                  <h4 className="font-bold text-white group-hover:text-teal-400 transition-colors">
                    {session.name}
                  </h4>
                  <p className="text-xs text-zinc-400">
                    {new Date(session.completedAt || "").toLocaleDateString(
                      undefined,
                      {
                        weekday: "short",
                        month: "short",
                        day: "numeric",
                      },
                    )}
                    {" · "}
                    {session.exercises.length} exercises
                  </p>
                </div>
                <ArrowRight className="h-4 w-4 text-zinc-600 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 p-8 text-center">
            <p className="text-sm text-zinc-400">
              No recent workouts logged yet.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
export default TodayPage;
