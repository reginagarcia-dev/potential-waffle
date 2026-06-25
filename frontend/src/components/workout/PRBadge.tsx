import { cn } from "@/lib/utils";

type PRBadgeProps = {
  className?: string;
  label?: string;
};

export function PRBadge({ className, label = "PR" }: PRBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-accent/60 bg-accent/10 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent shadow-amberGlow",
        className,
      )}
    >
      {label}
    </span>
  );
}
