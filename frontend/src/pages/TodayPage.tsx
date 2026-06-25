import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { WorkoutSessionResponse } from "shared";
import { PageHeader } from "@/components/Layout/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { ProductButton } from "@/components/ui/ProductButton";
import { PRBadge } from "@/components/workout/PRBadge";
import { WorkoutSummaryCard } from "@/components/workout/WorkoutSummaryCard";
import { useNavigate } from "react-router-dom";
import { Play, Dumbbell, ArrowRight } from "lucide-react";
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

  return (
    <div className="flex flex-1 flex-col gap-5 px-4 py-5">
      <PageHeader
        title="Today"
        subtitle={`${getGreeting()}, ${user?.email.split("@")[0]} 💪`}
        action={
          <button className="inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/50 hover:text-foreground">
            <Bell className="size-5" />
          </button>
        }
      />

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

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Last Workout
        </h2>

        <WorkoutSummaryCard
          name="Lower Body A"
          date="Jun 21"
          duration="54 min"
          sets={18}
          volume="12,450 lbs"
        />
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Recent PRs {recentPrs.length > 0 ? `(${recentPrs.length})` : ""}
        </h2>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Squat</p>
              <p className="text-sm tabular-nums text-foreground">145 x 8</p>
            </div>
            <PRBadge />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <div>
              <p className="text-sm font-semibold text-foreground">
                Romanian Deadlift
              </p>
              <p className="text-sm tabular-nums text-foreground">100 x 10</p>
            </div>
            <PRBadge />
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Recent Workouts {loadingRecent ? "(loading...)" : ""}
        </h2>

        <div className="space-y-2">
          <WorkoutSummaryCard
            name="Lower Body A"
            date="Jun 21"
            duration="54 min"
            sets={18}
            volume="12,450 lbs"
          />
          <WorkoutSummaryCard
            name="Upper Body B"
            date="Jun 19"
            duration="48 min"
            sets={16}
            volume="9,820 lbs"
          />
        </div>
      </section>
    </div>
  );
}
