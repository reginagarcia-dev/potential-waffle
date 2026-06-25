import { ChevronRight } from "lucide-react";

type WorkoutSummaryCardProps = {
  name: string;
  date: string;
  duration: string;
  sets: number;
  volume: string;
  onClick?: () => void;
};

export function WorkoutSummaryCard({
  name,
  date,
  duration,
  sets,
  volume,
  onClick,
}: WorkoutSummaryCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-xl border border-border bg-card p-4 text-left transition hover:bg-card/90"
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{name}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {date} · {duration}
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {sets} sets · {volume}
          </p>
        </div>

        <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
      </div>
    </button>
  );
}
