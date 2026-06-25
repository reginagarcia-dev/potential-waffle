import type { ReactNode } from "react";

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
};

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>

      {action ? <div>{action}</div> : null}
    </header>
  );
}
