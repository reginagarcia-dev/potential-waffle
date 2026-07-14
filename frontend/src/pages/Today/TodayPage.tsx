import { ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { WorkoutSessionResponse } from "shared";
import { useAuth } from "@/context/AuthContext";
import { ProductButton } from "@/components/ui/ProductButton";
import { PRListCard } from "@/components/workout/PRListCard";
import { getSessionDurationMinutes } from "@/lib/session";
import { formatShortDate } from "@/lib/dates";
import { useNavigate } from "react-router-dom";

// Matches the height of a loaded 3-row card (PRs / Recent Workouts) so
// swapping from loading -> loaded doesn't shift the rest of the page (CLS).
function SkeletonCard({ trailingIcon }: { trailingIcon?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      {[0, 1, 2].map((idx) => (
        <div
          key={idx}
          className={`flex items-center justify-between${idx > 0 ? " mt-4 border-t border-border pt-4" : ""}`}
        >
          <div className="space-y-2">
            <div className="h-3.5 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
          </div>
          {trailingIcon && (
            <div className="size-5 shrink-0 animate-pulse rounded-full bg-muted" />
          )}
        </div>
      ))}
    </div>
  );
}

export function TodayPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 1. Fetch active session
  const {
    data: activeSession,
    isLoading: loadingActive,
    isError: activeSessionError,
    refetch: refetchActiveSession,
  } = useQuery<WorkoutSessionResponse | null>({
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

  // 3. Fetch all-time PRs from dedicated endpoint (not limited to recent sessions)
  const { data: recentPrsRaw, isLoading: loadingPrs } = useQuery<
    Array<{
      exerciseName: string;
      weight: number;
      reps: number | null;
      unit: string;
      date: string | null;
    }>
  >({
    queryKey: ["recentPrs"],
    queryFn: () => apiFetch("/progress/recent-prs"),
  });

  const recentPrs = (recentPrsRaw ?? []).map((pr) => ({
    ...pr,
    date: pr.date ? formatShortDate(pr.date) : "",
  }));

  const getSessionDate = (session: WorkoutSessionResponse) =>
    formatShortDate(session.completedAt || session.startedAt);

  const getSessionDuration = (session: WorkoutSessionResponse) => {
    const mins = getSessionDurationMinutes(session);
    return mins ? `${mins} min` : "—";
  };

  const getSessionSets = (session: WorkoutSessionResponse) =>
    session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.status === "completed").length,
      0,
    );

  const handleStartWorkout = () => {
    navigate("/session/new");
  };
  const handleResumeWorkout = () => {
    if (activeSession) {
      navigate(`/session/${activeSession.id}`);
    }
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Good morning";
    if (hr < 17) return "Good afternoon";
    return "Good evening";
  };

  const username = user?.email.split("@")[0] ?? "";
  const displayName = username.charAt(0).toUpperCase() + username.slice(1);

  return (
    <div className="flex flex-1 flex-col gap-5 px-4">
      <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 border-b border-border bg-background px-4 pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Today
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {getGreeting()}, {displayName} 💪
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-center py-2">
        <ProductButton
          fullWidth
          className="px-10"
          onClick={
            activeSessionError
              ? () => refetchActiveSession()
              : activeSession
                ? handleResumeWorkout
                : handleStartWorkout
          }
        >
          {loadingActive
            ? "Loading session..."
            : activeSessionError
              ? "Couldn't check session — Tap to retry"
              : activeSession
                ? "Resume Workout"
                : "+ Start Workout"}
        </ProductButton>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Recent PRs
        </h2>

        {loadingPrs ? (
          <SkeletonCard trailingIcon />
        ) : recentPrs.length > 0 ? (
          <PRListCard
            entries={recentPrs.slice(0, 3)}
            emphasize
            footer={
              recentPrs.length > 3 && (
                <button
                  onClick={() =>
                    navigate("/history", { state: { prOnly: true } })
                  }
                  className="mt-4 flex w-full items-center justify-center border-t border-border pt-4 text-xs font-semibold text-primary transition hover:text-primary/80"
                >
                  Show All
                </button>
              )
            }
          />
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No recent PRs yet. Keep lifting!
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Recent Workouts
        </h2>

        {loadingRecent ? (
          <SkeletonCard trailingIcon />
        ) : recentSessions && recentSessions.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            {recentSessions.slice(0, 3).map((session, idx) => (
              <button
                key={session.id}
                type="button"
                onClick={() => navigate(`/history/${session.id}`)}
                className={`flex w-full items-center justify-between gap-3 text-left transition hover:opacity-80${idx > 0 ? " mt-4 border-t border-border pt-4" : ""}`}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {session.name}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {getSessionDate(session)} · {getSessionDuration(session)} ·{" "}
                    {getSessionSets(session)} sets
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {recentSessions.length > 3 && (
              <button
                onClick={() => navigate("/history")}
                className="mt-4 flex w-full items-center justify-center border-t border-border pt-4 text-xs font-semibold text-primary transition hover:text-primary/80"
              >
                Show All
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No workouts recorded yet.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
