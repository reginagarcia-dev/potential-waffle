import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateCardProps = {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
  contentClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
};

export function EmptyStateCard({
  icon,
  title,
  description,
  action,
  className,
  contentClassName,
  titleClassName,
  descriptionClassName,
}: EmptyStateCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-border p-10 text-center",
        className,
      )}
    >
      <div className={cn("mx-auto max-w-xs", contentClassName)}>
        {icon && <div className="mx-auto mb-3 flex justify-center">{icon}</div>}

        <h3 className={cn("text-sm font-semibold text-foreground", titleClassName)}>
          {title}
        </h3>

        {description && (
          <p
            className={cn(
              "mt-1 text-xs text-muted-foreground",
              descriptionClassName,
            )}
          >
            {description}
          </p>
        )}

        {action && <div className="mt-4">{action}</div>}
      </div>
    </div>
  );
}