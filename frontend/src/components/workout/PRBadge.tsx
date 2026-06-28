import { Award } from "lucide-react";
import { cn } from "@/lib/utils";

type PRBadgeProps = {
  className?: string;
};

export function PRBadge({ className }: PRBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border border-accent/60 bg-accent/10 p-1 text-accent shadow-amberGlow",
        className,
      )}
    >
      <Award className="size-3.5 fill-accent/20" />
    </span>
  );
}
