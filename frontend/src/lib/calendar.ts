export type DayCell = {
  key: string;
  label: number;
  inCurrentMonth: boolean;
  dayKey: string;
};

const pad2 = (value: number) => String(value).padStart(2, "0");

export const toDayKey = (date: Date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

// Builds a 6-week (42-cell) grid for the given month, including the trailing
// days of the previous month and leading days of the next month needed to
// fill out full weeks (Monday-first).
export function buildMonthGrid(viewedMonth: Date): DayCell[] {
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

  const dayCells: DayCell[] = [];

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

  return dayCells;
}
