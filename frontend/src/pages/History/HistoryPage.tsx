import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api.js";
import {
  Award,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  Dumbbell,
} from "lucide-react";
import { WorkoutSessionResponse } from "shared";
import { ProductButton } from "@/components/ui/ProductButton";
import { PRBadge } from "@/components/workout/PRBadge";

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prOnly, setPrOnly] = useState(
    () => (location.state as any)?.prOnly === true,
  );
  const [viewedMonth, setViewedMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);

  const pad2 = (value: number) => String(value).padStart(2, "0");

  const toDayKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

  const toMonthKey = (date: Date) =>
    `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;

  const viewedMonthKey = toMonthKey(viewedMonth);

  const buildSessionsPath = (start: Date, end: Date, limit: number = 50) => {
    const params = new URLSearchParams({
      page: "1",
      limit: String(limit),
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    });
    return `/sessions?${params.toString()}`;
  };

  const monthStart = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth(),
    1,
  );
  const monthEnd = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth() + 1,
    1,
  );

  const { data: monthSessionsData = [], isPending: pendingMonth } = useQuery<
    WorkoutSessionResponse[]
  >({
    queryKey: ["workoutHistory", "month", viewedMonthKey],
    queryFn: () => apiFetch(buildSessionsPath(monthStart, monthEnd, 50)),
    placeholderData: keepPreviousData,
  });

  const { data: prSourceSessions = [], isPending: pendingPr } = useQuery<
    WorkoutSessionResponse[]
  >({
    queryKey: ["workoutHistory", "pr"],
    enabled: prOnly,
    // TODO: paginate or use a dedicated endpoint — PRs beyond 50 sessions won't appear
    queryFn: () => apiFetch("/sessions?page=1&limit=50"),
  });

  const { data: anySessions = [], isPending: pendingAny } = useQuery<
    WorkoutSessionResponse[]
  >({
    queryKey: ["workoutHistory", "any"],
    enabled: !prOnly,
    queryFn: () => apiFetch("/sessions?page=1&limit=1"),
  });

  const monthSessions = monthSessionsData.filter(
    (session) => session.completedAt,
  );
  // The month query already holds every session for the viewed month, so a
  // selected day is a client-side filter — no extra request needed.
  const daySessions = selectedDayKey
    ? monthSessions.filter(
        (session) =>
          toDayKey(new Date(session.completedAt!)) === selectedDayKey,
      )
    : [];
  const completedSessions = prSourceSessions.filter(
    (session) => session.completedAt,
  );
  const hasAnyCompletedSessions = anySessions.some((session) =>
    Boolean(session.completedAt),
  );

  const isLoading = prOnly ? pendingPr : pendingMonth || pendingAny;

  const hasPr = (session: WorkoutSessionResponse) =>
    session.exercises.some((ex) => ex.sets.some((s) => s.isPr));

  const prSessions = completedSessions.filter(hasPr);

  const prEntries = prSessions.flatMap((session) =>
    session.exercises.flatMap((ex) =>
      ex.sets
        .filter((s) => s.isPr)
        .map((s) => ({
          id: s.id,
          exerciseName: ex.nameSnapshot,
          weight: s.weight,
          reps: s.reps,
          unit: session.unit,
          date: session.completedAt
            ? new Date(session.completedAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })
            : "",
        })),
    ),
  );

  const workoutDayKeys = new Set(
    monthSessions
      .map((session) => session.completedAt)
      .filter((value): value is string => Boolean(value))
      .map((completedAt) => toDayKey(new Date(completedAt))),
  );

  const visibleMonthSessions = selectedDayKey ? daySessions : monthSessions;

  const shiftViewedMonth = (delta: number) => {
    setViewedMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1),
    );
    setSelectedDayKey(null);
  };

  const firstDayOfMonth = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth(),
    1,
  );
  const leadingDays = (firstDayOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth() + 1,
    0,
  ).getDate();
  const trailingDays = 42 - leadingDays - daysInMonth;
  const prevMonthDays = new Date(
    viewedMonth.getFullYear(),
    viewedMonth.getMonth(),
    0,
  ).getDate();

  const dayCells: Array<{
    key: string;
    label: number;
    inCurrentMonth: boolean;
    dayKey: string;
  }> = [];

  for (let i = 0; i < leadingDays; i += 1) {
    const day = prevMonthDays - leadingDays + i + 1;
    const date = new Date(
      viewedMonth.getFullYear(),
      viewedMonth.getMonth() - 1,
      day,
    );
    dayCells.push({
      key: `prev-${toDayKey(date)}`,
      label: day,
      inCurrentMonth: false,
      dayKey: toDayKey(date),
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(
      viewedMonth.getFullYear(),
      viewedMonth.getMonth(),
      day,
    );
    dayCells.push({
      key: `current-${toDayKey(date)}`,
      label: day,
      inCurrentMonth: true,
      dayKey: toDayKey(date),
    });
  }

  for (let day = 1; day <= trailingDays; day += 1) {
    const date = new Date(
      viewedMonth.getFullYear(),
      viewedMonth.getMonth() + 1,
      day,
    );
    dayCells.push({
      key: `next-${toDayKey(date)}`,
      label: day,
      inCurrentMonth: false,
      dayKey: toDayKey(date),
    });
  }

  const getSessionDuration = (session: WorkoutSessionResponse) => {
    if (!session.completedAt || !session.startedAt) return 0;
    return Math.max(
      1,
      Math.round(
        (new Date(session.completedAt).getTime() -
          new Date(session.startedAt).getTime()) /
          60000,
      ),
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const renderSessionCard = (session: WorkoutSessionResponse) => {
    const duration = getSessionDuration(session);

    return (
      <div
        key={session.id}
        onClick={() => navigate(`/history/${session.id}`)}
        className="group flex cursor-pointer items-center justify-between rounded-xl border border-border bg-card p-4 transition-all hover:border-border/70 hover:bg-surface"
      >
        <div className="min-w-0 flex-1 space-y-1.5 pr-4">
          <div className="flex items-center gap-2">
            <h4 className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {session.name}
            </h4>
            {session.exercises.some((ex) => ex.sets.some((s) => s.isPr)) && (
              <PRBadge />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="size-3.5" />
              {duration}m
            </span>
            <span className="flex items-center gap-1">
              <Dumbbell className="size-3.5" />
              {session.exercises.length} ex
            </span>
            <span className="font-normal text-muted-foreground">
              {new Date(session.completedAt!).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        </div>

        <ChevronRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
    );
  };

  const monthLabel = viewedMonth.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  const selectedDayLabel = selectedDayKey
    ? new Date(`${selectedDayKey}T12:00:00`).toLocaleDateString(undefined, {
        weekday: "long",
        month: "long",
        day: "numeric",
      })
    : null;

  const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="space-y-6 px-4">
      <div className="sticky top-[env(safe-area-inset-top)] z-10 border-b border-border bg-background pt-6 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              Workout History
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review your past performance logs
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPrOnly((v) => !v)}
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              prOnly
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-accent"
            }`}
          >
            <Award className="size-3.5" />
            PRs only
          </button>
        </div>
      </div>

      {prOnly || hasAnyCompletedSessions ? (
        <div className="space-y-6">
          {prOnly && prEntries.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Award className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">
                No PR workouts yet
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Keep lifting — your first PR will show up here.
              </p>
            </div>
          )}

          {prOnly ? (
            <div className="rounded-xl border border-border bg-card p-4">
              {prEntries.map((pr, idx) => (
                <div
                  key={pr.id}
                  className={`flex items-center justify-between${idx > 0 ? " mt-4 border-t border-border pt-4" : ""}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {pr.exerciseName}
                    </p>
                    <p className="text-sm tabular-nums text-muted-foreground">
                      {pr.weight != null ? `${pr.weight} ${pr.unit}` : "—"}
                      {pr.reps ? ` × ${pr.reps} reps` : ""}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {pr.date}
                    </p>
                  </div>
                  <PRBadge />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="rounded-2xl border border-border bg-card p-4">
                <div className="mb-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => shiftViewedMonth(-1)}
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="size-5" />
                  </button>

                  <h2 className="text-base font-semibold text-foreground">
                    {monthLabel}
                  </h2>

                  <button
                    type="button"
                    onClick={() => shiftViewedMonth(1)}
                    className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
                    aria-label="Next month"
                  >
                    <ChevronRight className="size-5" />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {weekdayLabels.map((label) => (
                    <div key={label}>{label}</div>
                  ))}
                </div>

                <div className="mt-2 grid grid-cols-7 gap-y-2">
                  {dayCells.map((cell) => {
                    const isSelected =
                      cell.inCurrentMonth && selectedDayKey === cell.dayKey;
                    const hasWorkout =
                      cell.inCurrentMonth && workoutDayKeys.has(cell.dayKey);

                    return (
                      <button
                        key={cell.key}
                        type="button"
                        disabled={!cell.inCurrentMonth}
                        onClick={() => {
                          if (!cell.inCurrentMonth) return;
                          setSelectedDayKey((prev) =>
                            prev === cell.dayKey ? null : cell.dayKey,
                          );
                        }}
                        className={`mx-auto flex size-10 flex-col items-center justify-center rounded-full text-sm transition ${
                          cell.inCurrentMonth
                            ? isSelected
                              ? "bg-primary text-primary-foreground"
                              : "text-foreground hover:bg-muted/60"
                            : "text-muted-foreground/40"
                        }`}
                      >
                        <span>{cell.label}</span>
                        <span
                          className={`mt-0.5 size-1.5 rounded-full ${
                            hasWorkout
                              ? isSelected
                                ? "bg-primary-foreground"
                                : "bg-primary"
                              : "bg-transparent"
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">
                  {selectedDayLabel ?? monthLabel}
                </h3>
                <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-muted-foreground">
                  {visibleMonthSessions.length} workout
                  {visibleMonthSessions.length === 1 ? "" : "s"}
                </span>
              </div>

              {visibleMonthSessions.length > 0 ? (
                <div className="space-y-2">
                  {visibleMonthSessions.map(renderSessionCard)}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-10 text-center">
                  <Calendar className="mx-auto mb-3 size-8 text-muted-foreground" />
                  <p className="text-sm font-semibold text-foreground">
                    No workouts found
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {selectedDayLabel
                      ? "No workouts logged on this day."
                      : "No workouts logged in this month."}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">
            No workouts recorded yet
          </h3>
          <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
            Workouts you finish will be listed here, grouped by calendar month.
          </p>
          <div className="mt-4">
            <ProductButton fullWidth onClick={() => navigate("/session/new")}>
              Log First Workout
            </ProductButton>
          </div>
        </div>
      )}
    </div>
  );
};
export default HistoryPage;
