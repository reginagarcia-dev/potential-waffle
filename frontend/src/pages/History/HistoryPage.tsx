import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api.js';
import { Award, Calendar, ChevronRight, Clock, Dumbbell } from 'lucide-react';
import { WorkoutSessionResponse } from 'shared';
import { ProductButton } from '@/components/ui/ProductButton';
import { PRBadge } from '@/components/workout/PRBadge';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [prOnly, setPrOnly] = useState(() => (location.state as any)?.prOnly === true);

  const { data: sessions = [], isLoading } = useQuery<WorkoutSessionResponse[]>({
    queryKey: ['workoutHistory'],
    queryFn: () => apiFetch('/sessions?page=1&limit=50'),
  });

  const hasPr = (session: WorkoutSessionResponse) =>
    session.exercises.some((ex) => ex.sets.some((s) => s.isPr));

  const visibleSessions = prOnly ? sessions.filter(hasPr) : sessions;

  const groupSessionsByMonth = (list: WorkoutSessionResponse[]) => {
    const groups: { [month: string]: WorkoutSessionResponse[] } = {};
    list.forEach((session) => {
      if (!session.completedAt) return;
      const date = new Date(session.completedAt);
      const monthYear = date.toLocaleDateString(undefined, { year: 'numeric', month: 'long' });
      if (!groups[monthYear]) groups[monthYear] = [];
      groups[monthYear].push(session);
    });
    return groups;
  };

  const grouped = groupSessionsByMonth(visibleSessions);

  const getSessionVolume = (session: WorkoutSessionResponse) =>
    session.exercises.reduce((acc, ex) =>
      acc + ex.sets.reduce((sum, s) =>
        s.status === 'completed' && s.type === 'working' && s.weight && s.reps
          ? sum + s.weight * s.reps
          : sum, 0), 0);

  const getSessionDuration = (session: WorkoutSessionResponse) => {
    if (!session.completedAt || !session.startedAt) return 0;
    return Math.max(1, Math.round(
      (new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000
    ));
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4">
      <div className="sticky top-0 z-10 -mx-4 border-b border-border bg-background px-4 pt-5 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Workout History</h1>
            <p className="mt-1 text-sm text-muted-foreground">Review your past performance logs</p>
          </div>
          <button
            type="button"
            onClick={() => setPrOnly((v) => !v)}
            className={`mt-1 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
              prOnly
                ? 'border-accent/40 bg-accent/10 text-accent'
                : 'border-border bg-surface text-muted-foreground hover:border-accent/30 hover:text-accent'
            }`}
          >
            <Award className="size-3.5" />
            PRs only
          </button>
        </div>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-6">
          {prOnly && visibleSessions.length === 0 && (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <Award className="mx-auto mb-3 size-8 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">No PR workouts yet</p>
              <p className="mt-1 text-xs text-muted-foreground">Keep lifting — your first PR will show up here.</p>
            </div>
          )}
          {Object.keys(grouped).map((month) => (
            <div key={month} className="space-y-3">
              <h2 className="pl-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {month}
              </h2>

              <div className="space-y-2">
                {grouped[month].map((session) => {
                  const vol = getSessionVolume(session);
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
                          {session.exercises.some(ex => ex.sets.some(s => s.isPr)) && (
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
                          {vol > 0 && (
                            <span className="text-primary">
                              {vol.toLocaleString()} {session.unit}
                            </span>
                          )}
                          <span className="font-normal text-muted-foreground">
                            {new Date(session.completedAt!).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="size-4 text-muted-foreground transition-all group-hover:translate-x-0.5 group-hover:text-primary" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="mx-auto mb-3 size-8 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">No workouts recorded yet</h3>
          <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
            Workouts you finish will be listed here, grouped by calendar month.
          </p>
          <div className="mt-4">
            <ProductButton fullWidth onClick={() => navigate('/session/new')}>
              Log First Workout
            </ProductButton>
          </div>
        </div>
      )}
    </div>
  );
};
export default HistoryPage;
