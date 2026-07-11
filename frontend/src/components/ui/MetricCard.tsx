import type { ReactNode } from "react";

type MetricCardProps = {
  label: string;
  value: string;
  icon?: ReactNode;
};

export function MetricCard({ label, value, icon }: MetricCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 text-center">
      {icon && <div className="mx-auto mb-1.5 flex justify-center">{icon}</div>}
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
        {value}
      </p>
    </div>
  );
}
