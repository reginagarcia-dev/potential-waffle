import { ChevronLeft, ChevronRight } from "lucide-react";
import type { DayCell } from "@/lib/calendar";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type MonthCalendarProps = {
  monthLabel: string;
  dayCells: DayCell[];
  selectedDayKey: string | null;
  workoutDayKeys: Set<string>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onSelectDay: (dayKey: string) => void;
};

export function MonthCalendar({
  monthLabel,
  dayCells,
  selectedDayKey,
  workoutDayKeys,
  onPrevMonth,
  onNextMonth,
  onSelectDay,
}: MonthCalendarProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrevMonth}
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
          onClick={onNextMonth}
          className="inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/60 hover:text-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-y-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {WEEKDAY_LABELS.map((label) => (
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
                onSelectDay(cell.dayKey);
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
  );
}
