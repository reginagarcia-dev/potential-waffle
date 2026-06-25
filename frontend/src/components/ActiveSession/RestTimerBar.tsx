import React from 'react';
import { useRestTimer } from '../../context/RestTimerContext.js';
import { FastForward, Plus } from 'lucide-react';

export const RestTimerBar: React.FC = () => {
  const { timeRemaining, duration, isActive, nextInfo, add30Seconds, skip } = useRestTimer();

  if (!isActive || timeRemaining <= 0) return null;

  const percent = duration > 0 ? (timeRemaining / duration) * 100 : 0;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed bottom-[65px] left-0 right-0 z-40 border-t border-zinc-800/80 bg-zinc-950/90 px-4 py-3 backdrop-blur-lg safe-bottom">
      {/* Progress track */}
      <div className="absolute top-0 left-0 h-[2px] bg-zinc-800 w-full">
        <div 
          className="h-full bg-teal-500 transition-all duration-1000 ease-linear" 
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <span className="font-heading text-lg font-bold text-white tracking-wide flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-teal-500 animate-ping"></span>
            Resting {formatTime(timeRemaining)}
          </span>
          {nextInfo && (
            <span className="text-xs text-zinc-400 font-medium">
              Next: {nextInfo}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={add30Seconds}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Plus className="h-3 w-3" />
            +30s
          </button>
          <button
            onClick={skip}
            className="flex items-center gap-1 rounded-lg bg-teal-950 border border-teal-800 px-3 py-1.5 text-xs font-semibold text-teal-400 transition-colors hover:bg-teal-900 hover:text-teal-300"
          >
            <FastForward className="h-3 w-3" />
            Skip
          </button>
        </div>
      </div>
    </div>
  );
};
export default RestTimerBar;
