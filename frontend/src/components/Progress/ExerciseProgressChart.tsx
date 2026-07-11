import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type ChartPoint = {
  formattedDate: string;
  bestWeight: number;
};

type ExerciseProgressChartProps = {
  data: ChartPoint[];
};

export function ExerciseProgressChart({ data }: ExerciseProgressChartProps) {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <TrendingUp className="size-4 text-primary" />
        Max Weight Over Time
      </h3>
      <div className="h-56 w-full text-xs text-muted-foreground">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="formattedDate" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                borderColor: "hsl(var(--border))",
                borderRadius: "8px",
              }}
              labelStyle={{
                color: "hsl(var(--foreground))",
                fontWeight: "bold",
              }}
              itemStyle={{ color: "hsl(var(--primary))" }}
            />
            <Line
              type="monotone"
              dataKey="bestWeight"
              name="Max Weight"
              stroke="hsl(var(--primary))"
              strokeWidth={3}
              activeDot={{ r: 6 }}
              dot={{
                r: 4,
                stroke: "hsl(var(--primary))",
                strokeWidth: 1,
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
