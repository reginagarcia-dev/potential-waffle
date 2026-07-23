import React from "react";
import { TrendingUp, X } from "lucide-react";
import { ProgressionSuggestion, Unit } from "shared";

interface SuggestionBannerProps {
  suggestion: ProgressionSuggestion;
  unit: Unit;
  onApply: () => void;
  onDismiss: () => void;
  isApplying?: boolean;
}

const COPY: Record<ProgressionSuggestion["basis"], string> = {
  increase: "Last time was manageable — try",
  hold_reps_up: "Solid effort last time — try",
  repeat_high_rpe: "That was near your max — repeat",
  repeat_no_rpe: "No effort logged last time — repeat",
};

export const SuggestionBanner: React.FC<SuggestionBannerProps> = ({
  suggestion,
  unit,
  onApply,
  onDismiss,
  isApplying,
}) => {
  const repsNote = suggestion.basis === "hold_reps_up" ? " (one more rep)" : "";

  return (
    <div className="mx-4 mb-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <TrendingUp className="size-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm text-foreground">
          {COPY[suggestion.basis]}{" "}
          <span className="font-semibold tabular-nums">
            {suggestion.weight}
            {unit} × {suggestion.reps}
          </span>
          {repsNote}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onApply}
          disabled={isApplying}
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60"
        >
          Apply
        </button>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss suggestion"
          className="inline-flex size-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
};

export default SuggestionBanner;
