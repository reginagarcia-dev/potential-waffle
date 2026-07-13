import { Award, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { MilestoneAchieved } from "shared";

type MilestoneBannerProps = {
  milestones: MilestoneAchieved[];
};

function ordinal(n: number): string {
  const remainder100 = n % 100;
  if (remainder100 >= 11 && remainder100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function milestoneCopy({ kind, threshold }: MilestoneAchieved): string {
  return kind === "days_logged"
    ? `${ordinal(threshold)} day logged!`
    : `${ordinal(threshold)} PR earned!`;
}

export function MilestoneBanner({ milestones }: MilestoneBannerProps) {
  if (milestones.length === 0) return null;

  return (
    <section className="mt-4 space-y-2">
      {milestones.map((milestone, idx) => (
        <div
          key={idx}
          className={cn(
            "flex items-center gap-3 rounded-xl border border-accent/60 bg-accent/10 px-4 py-3 text-accent shadow-amberGlow",
          )}
        >
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent/15">
            {milestone.kind === "days_logged" ? (
              <Trophy className="size-5" />
            ) : (
              <Award className="size-5" />
            )}
          </span>

          <p className="text-sm font-semibold">{milestoneCopy(milestone)}</p>
        </div>
      ))}
    </section>
  );
}
