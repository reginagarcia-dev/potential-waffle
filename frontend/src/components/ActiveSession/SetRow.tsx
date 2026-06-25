import React, { useState } from 'react';
import { WorkoutSetResponse } from 'shared';
import { CheckCircle2, Circle, Trash2, Award } from 'lucide-react';

interface SetRowProps {
  set: WorkoutSetResponse;
  unit: 'lbs' | 'kg';
  onToggleComplete: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SetRow: React.FC<SetRowProps> = ({
  set,
  unit,
  onToggleComplete,
  onEdit,
  onDelete,
}) => {
  // Swipe to delete gestures
  const [startX, setStartX] = useState(0);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentX = e.touches[0].clientX;
    const deltaX = currentX - startX;
    
    // Only allow left swiping
    if (deltaX < 0) {
      setTranslateX(Math.max(-100, deltaX));
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    if (translateX < -70) {
      onDelete();
    }
    setTranslateX(0);
  };

  return (
    <div className="relative overflow-hidden rounded-lg bg-zinc-950">
      {/* Background Delete Button Action */}
      <div className="absolute inset-y-0 right-0 flex w-[100px] items-center justify-center bg-red-600/90 text-white transition-opacity">
        <div className="flex flex-col items-center gap-1">
          <Trash2 className="h-4 w-4" />
          <span className="text-[10px] font-bold uppercase">Delete</span>
        </div>
      </div>

      {/* Main Row Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ transform: `translateX(${translateX}px)` }}
        className="relative flex items-center justify-between border-b border-zinc-900 bg-zinc-900/40 py-3 px-4 transition-transform duration-200"
      >
        {/* Set Identifier Column */}
        <div className="flex w-10 items-center">
          {set.type === 'warmup' ? (
            <span className="inline-flex items-center justify-center rounded-md bg-zinc-800 border border-zinc-700/60 px-1.5 py-0.5 text-[10px] font-black text-zinc-400">
              W
            </span>
          ) : (
            <span className="text-sm font-black text-zinc-500">{set.setNumber}</span>
          )}
        </div>

        {/* Previous Stats Column */}
        <div className="flex flex-1 justify-start px-2">
          {set.previousWeight && set.previousReps ? (
            <span className="text-xs text-zinc-500 font-semibold truncate">
              {set.previousWeight} × {set.previousReps}
            </span>
          ) : (
            <span className="text-xs text-zinc-600 font-semibold">—</span>
          )}
        </div>

        {/* Inputs Column: Weight & Reps */}
        <div className="flex items-center gap-3 w-32 justify-end">
          {/* Weight Button */}
          <button
            type="button"
            onClick={onEdit}
            className={`rounded-lg bg-zinc-950 border border-zinc-800/80 px-2 py-1.5 text-center text-xs font-bold w-16 transition-colors hover:border-zinc-700 ${
              set.weight ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {set.weight ? `${set.weight}` : '—'}
            <span className="text-[8px] text-zinc-500 ml-0.5">{unit}</span>
          </button>

          {/* Reps Button */}
          <button
            type="button"
            onClick={onEdit}
            className={`rounded-lg bg-zinc-950 border border-zinc-800/80 px-2 py-1.5 text-center text-xs font-bold w-12 transition-colors hover:border-zinc-700 ${
              set.reps ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {set.reps ? `${set.reps}` : '—'}
            <span className="text-[8px] text-zinc-500 ml-0.5">r</span>
          </button>
        </div>

        {/* Optional RPE Column */}
        <div className="flex w-10 justify-center">
          <button
            type="button"
            onClick={onEdit}
            className={`text-xs font-extrabold ${set.rpe ? 'text-teal-400' : 'text-zinc-600'}`}
          >
            {set.rpe ? `@${set.rpe}` : '@—'}
          </button>
        </div>

        {/* Checkmark Status Column */}
        <div className="flex w-10 justify-end items-center gap-1.5">
          {set.isPr && set.status === 'completed' && (
            <Award className="h-4 w-4 text-amber-500 fill-amber-500/10 animate-bounce" />
          )}
          <button
            type="button"
            onClick={onToggleComplete}
            className="text-zinc-500 transition-colors hover:text-teal-400"
          >
            {set.status === 'completed' ? (
              <CheckCircle2 className="h-6 w-6 text-teal-400 fill-teal-950/20" />
            ) : (
              <Circle className="h-6 w-6 text-zinc-800" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
export default SetRow;
