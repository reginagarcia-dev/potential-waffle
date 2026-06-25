import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api.js';
import { Calendar, ArrowRight, Clock, Award, Dumbbell } from 'lucide-react';
import { WorkoutSessionResponse } from 'shared';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  // Fetch paginated history list (large limit for simple scroll)
  const { data: sessions = [], isLoading } = useQuery<WorkoutSessionResponse[]>({
    queryKey: ['workoutHistory'],
    queryFn: () => apiFetch('/sessions?page=1&limit=50'),
  });

  // Helper to group sessions by month
  const groupSessionsByMonth = (list: WorkoutSessionResponse[]) => {
    const groups: { [month: string]: WorkoutSessionResponse[] } = {};
    
    list.forEach((session) => {
      if (!session.completedAt) return;
      const date = new Date(session.completedAt);
      const monthYear = date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
      });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(session);
    });

    return groups;
  };

  const grouped = groupSessionsByMonth(sessions);

  // Helper to calculate total volume for a session
  const getSessionVolume = (session: WorkoutSessionResponse) => {
    return session.exercises.reduce((acc, ex) => {
      return acc + ex.sets.reduce((sum, s) => {
        if (s.status === 'completed' && s.type === 'working' && s.weight && s.reps) {
          return sum + (s.weight * s.reps);
        }
        return sum;
      }, 0);
    }, 0);
  };

  const getSessionDuration = (session: WorkoutSessionResponse) => {
    if (!session.completedAt || !session.startedAt) return 0;
    return Math.max(1, Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 60000));
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center text-teal-400">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white">Workout History</h1>
        <p className="text-sm text-zinc-400">Review your past performance logs</p>
      </div>

      {sessions.length > 0 ? (
        <div className="space-y-6">
          {Object.keys(grouped).map((month) => (
            <div key={month} className="space-y-3">
              <h2 className="font-heading text-xs font-bold text-zinc-500 uppercase tracking-widest pl-1">
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
                      className="group flex items-center justify-between rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 transition-all hover:bg-zinc-900/40 hover:border-zinc-800 cursor-pointer"
                    >
                      <div className="space-y-1.5 flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm truncate group-hover:text-teal-400 transition-colors">
                            {session.name}
                          </h4>
                          {session.exercises.some(ex => ex.sets.some(s => s.isPr)) && (
                            <span className="inline-flex rounded-full bg-amber-500/15 p-0.5 text-amber-500 border border-amber-500/20">
                              <Award className="h-3 w-3 fill-amber-500/10" />
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {duration}m
                          </span>
                          <span className="flex items-center gap-1">
                            <Dumbbell className="h-3.5 w-3.5" />
                            {session.exercises.length} ex
                          </span>
                          {vol > 0 && (
                            <span className="text-teal-500/80">
                              {vol.toLocaleString()} {session.unit}
                            </span>
                          )}
                          <span className="text-zinc-600 font-normal">
                            {new Date(session.completedAt!).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                      </div>
                      
                      <ArrowRight className="h-4 w-4 text-zinc-650 group-hover:text-teal-500 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center">
          <Calendar className="h-8 w-8 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-white">No workouts recorded yet</h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
            Workouts you finish will be listed here, grouped by calendar month.
          </p>
          <button
            onClick={() => navigate('/session/new')}
            className="mt-4 rounded-lg bg-teal-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-teal-500"
          >
            Log First Workout
          </button>
        </div>
      )}
    </div>
  );
};
export default HistoryPage;
