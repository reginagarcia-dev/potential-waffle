import { Bell, ChevronRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { WorkoutSessionResponse } from "shared";
import { useAuth } from "@/context/AuthContext";
import { ProductButton } from "@/components/ui/ProductButton";
import { PRBadge } from "@/components/workout/PRBadge";
import { WorkoutSummaryCard } from "@/components/workout/WorkoutSummaryCard";
import { useNavigate } from "react-router-dom";
export function TodayPage() {
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

  // 3. Fetch all-time PRs from dedicated endpoint (not limited to recent sessions)
  const { data: recentPrsRaw } = useQuery<
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
    date: pr.date
      ? new Date(pr.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        })
      : "",
  }));

  const getSessionDate = (session: WorkoutSessionResponse) =>
    new Date(session.completedAt || session.startedAt).toLocaleDateString(
      undefined,
      { month: "short", day: "numeric" },
    );

  const getSessionDuration = (session: WorkoutSessionResponse) => {
    if (!session.completedAt || !session.startedAt) return "—";
    const mins = Math.max(
      1,
      Math.round(
        (new Date(session.completedAt).getTime() -
          new Date(session.startedAt).getTime()) /
          60000,
      ),
    );
    return `${mins} min`;
  };

  const getSessionSets = (session: WorkoutSessionResponse) =>
    session.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter((s) => s.status === "completed").length,
      0,
    );

  const getSessionVolume = (session: WorkoutSessionResponse) => {
    const vol = session.exercises.reduce(
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
    );
    return `${vol.toLocaleString()} ${session.unit}`;
  };

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
      <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-background px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Today
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {getGreeting()}, {displayName} 💪
            </p>
          </div>
          <button className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
            <Bell className="size-5" />
          </button>
        </div>
      </div>

      <div className="py-2">
        <ProductButton
          fullWidth
          onClick={activeSession ? handleResumeWorkout : handleStartWorkout}
        >
          {loadingActive
            ? "Loading session..."
            : activeSession
              ? "Resume Workout"
              : "+ Start Workout"}
        </ProductButton>
      </div>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Last Workout
        </h2>

        {loadingRecent ? (
          <div className="h-20 animate-pulse rounded-xl bg-muted/30" />
        ) : recentSessions && recentSessions.length > 0 ? (
          <WorkoutSummaryCard
            name={recentSessions[0].name}
            date={getSessionDate(recentSessions[0])}
            duration={getSessionDuration(recentSessions[0])}
            sets={getSessionSets(recentSessions[0])}
            volume={getSessionVolume(recentSessions[0])}
            onClick={() => navigate(`/history/${recentSessions[0].id}`)}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            No workouts yet — start your first one!
          </p>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Recent PRs
        </h2>

        {recentPrs.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            {recentPrs.slice(0, 3).map((pr, idx) => (
              <div
                key={idx}
                className={`flex items-center justify-between${idx > 0 ? " mt-4 border-t border-border pt-4" : ""}`}
              >
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {pr.exerciseName}
                  </p>
                  <p className="text-sm tabular-nums text-foreground">
                    {pr.weight} {pr.unit}
                    {pr.reps ? ` × ${pr.reps}` : ""}
                  </p>
                </div>
                <PRBadge />
              </div>
            ))}
            {recentPrs.length > 3 && (
              <button
                onClick={() =>
                  navigate("/history", { state: { prOnly: true } })
                }
                className="mt-4 flex w-full items-center justify-center border-t border-border pt-4 text-xs font-semibold text-primary transition hover:text-primary/80"
              >
                Show All
              </button>
            )}
          </div>
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

        {recentSessions && recentSessions.length > 1 ? (
          <div className="rounded-xl border border-border bg-card p-4">
            {recentSessions.slice(1, 4).map((session, idx) => (
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
                    {getSessionSets(session)} sets · {getSessionVolume(session)}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </button>
            ))}
            {recentSessions.length > 4 && (
              <button
                onClick={() => navigate("/history")}
                className="mt-4 flex w-full items-center justify-center border-t border-border pt-4 text-xs font-semibold text-primary transition hover:text-primary/80"
              >
                Show All
              </button>
            )}
          </div>
        ) : !loadingRecent ? (
          <p className="text-sm text-muted-foreground">
            {recentSessions?.length === 1
              ? "Complete more workouts to see your history here."
              : "No workouts recorded yet."}
          </p>
        ) : null}
      </section>
    </div>
  );
}
