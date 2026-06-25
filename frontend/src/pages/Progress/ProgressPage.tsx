import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api.js';
import { Search, Dumbbell, Award, TrendingUp, BarChart4, ChevronRight, Activity } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ExerciseDefinition, ProgressSummary } from 'shared';

export const ProgressPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [selectedExercise, setSelectedExercise] = useState<ExerciseDefinition | null>(null);

  // 1. Fetch exercises for selection list
  const { data: exercises = [], isLoading: loadingLibrary } = useQuery<ExerciseDefinition[]>({
    queryKey: ['progressExercises', search],
    queryFn: () => apiFetch(`/exercises?q=${encodeURIComponent(search)}`),
  });

  // 2. Fetch progress metrics for selected exercise
  const { data: progressData, isLoading: loadingProgress } = useQuery<ProgressSummary>({
    queryKey: ['exerciseProgress', selectedExercise?.id],
    queryFn: () => apiFetch(`/progress/${selectedExercise!.id}`),
    enabled: !!selectedExercise,
  });

  // Format date strings for graph labels
  const chartData = progressData?.history.map(point => ({
    ...point,
    formattedDate: new Date(point.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  })) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
        <div>
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white">Analytics & Progress</h1>
          <p className="text-sm text-zinc-400">Visualize your lifts over time</p>
        </div>
        {selectedExercise && (
          <button
            onClick={() => setSelectedExercise(null)}
            className="text-xs font-bold text-teal-400 hover:text-teal-300"
          >
            Change Exercise
          </button>
        )}
      </div>

      {!selectedExercise ? (
        <div className="space-y-4">
          {/* Search Exercise Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exercise to view charts..."
              className="block w-full rounded-lg border border-zinc-850 bg-zinc-900/40 pl-9 pr-3 py-2.5 text-sm text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>

          {/* Exercise Library List */}
          <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-1 space-y-1">
            {loadingLibrary ? (
              <div className="py-8 text-center text-sm text-zinc-500">Loading exercise library...</div>
            ) : exercises.length > 0 ? (
              exercises.map((ex) => (
                <button
                  key={ex.id}
                  onClick={() => setSelectedExercise(ex)}
                  className="flex w-full items-center justify-between rounded-lg px-4 py-3.5 text-left hover:bg-zinc-900 text-sm font-semibold transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 group-hover:bg-teal-950 group-hover:text-teal-400 border border-zinc-850 transition-colors">
                      <Dumbbell className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="text-white block group-hover:text-teal-400 transition-colors">{ex.name}</span>
                      <span className="text-[9px] uppercase tracking-wider text-zinc-500 font-bold">{ex.muscleGroup}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-zinc-650 group-hover:text-teal-500 transition-colors" />
                </button>
              ))
            ) : (
              <div className="py-8 text-center text-sm text-zinc-500">No exercises found.</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Active Exercise Summary Header */}
          <div className="flex items-center gap-3 bg-zinc-900/15 rounded-xl border border-zinc-900 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-950 text-teal-400 border border-teal-900/60">
              <Dumbbell className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-heading text-lg font-black text-white">{selectedExercise.name}</h2>
              <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">
                {selectedExercise.muscleGroup} library definition
              </span>
            </div>
          </div>

          {loadingProgress ? (
            <div className="h-64 animate-pulse rounded-xl bg-zinc-900 border border-zinc-850" />
          ) : progressData && chartData.length > 0 ? (
            <div className="space-y-6">
              {/* Highlight Stats Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-zinc-900 bg-zinc-900/15 p-4 text-center">
                  <Award className="h-4 w-4 text-amber-500 mx-auto" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mt-1.5">All-Time Max Weight</span>
                  <span className="font-heading text-xl font-extrabold text-white mt-0.5 block">
                    {progressData.bestWeight ? `${progressData.bestWeight}` : '—'}
                  </span>
                </div>

                <div className="rounded-xl border border-zinc-900 bg-zinc-900/15 p-4 text-center">
                  <Activity className="h-4 w-4 text-teal-400 mx-auto animate-pulse" />
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block mt-1.5">All-Time Max Reps</span>
                  <span className="font-heading text-xl font-extrabold text-white mt-0.5 block">
                    {progressData.bestReps ? `${progressData.bestReps} reps` : '—'}
                  </span>
                </div>
              </div>

              {/* 1. Max Weight Chart (Line) */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                <h3 className="font-heading text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-teal-400" />
                  Max Weight Over Time
                </h3>
                <div className="h-56 w-full text-xs font-semibold text-zinc-500">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                      <XAxis dataKey="formattedDate" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                        labelClassName="text-white font-bold"
                        itemStyle={{ color: '#2dd4bf' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bestWeight"
                        name="Max Weight"
                        stroke="#0d9488"
                        strokeWidth={3}
                        activeDot={{ r: 6 }}
                        dot={{ r: 4, stroke: '#0f766e', strokeWidth: 1 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 2. Volume Chart (Bar) */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-4 space-y-3">
                <h3 className="font-heading text-xs font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart4 className="h-4 w-4 text-teal-400" />
                  Session Volume Trend
                </h3>
                <div className="h-56 w-full text-xs font-semibold text-zinc-500">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#18181b" />
                      <XAxis dataKey="formattedDate" stroke="#71717a" />
                      <YAxis stroke="#71717a" />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#09090b', borderColor: '#27272a', borderRadius: '8px' }}
                        labelClassName="text-white font-bold"
                        itemStyle={{ color: '#2dd4bf' }}
                      />
                      <Bar dataKey="volume" name="Total Volume" fill="#0f766e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* History Table */}
              <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-4 space-y-3">
                <h3 className="font-heading text-xs font-black text-zinc-500 uppercase tracking-wider">
                  Workout History Log
                </h3>
                <div className="space-y-2">
                  {chartData.slice().reverse().map((point, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2 border-b border-zinc-900 last:border-0 text-sm font-semibold text-zinc-300"
                    >
                      <span>{point.formattedDate}</span>
                      <div className="flex gap-4">
                        <span>
                          Best: <span className="text-white font-bold">{point.bestWeight}</span>
                        </span>
                        <span>
                          Vol: <span className="text-teal-400">{point.volume.toLocaleString()}</span>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-850 p-12 text-center bg-zinc-900/10">
              <TrendingUp className="h-8 w-8 text-zinc-650 mx-auto mb-3" />
              <h4 className="text-sm font-bold text-white">No performance data yet</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
                Once you complete workouts featuring this exercise, your progress charts will be shown here.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
export default ProgressPage;
