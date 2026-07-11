import type { ReactNode } from "react";
import { Dumbbell } from "lucide-react";

type AuthCardShellProps = {
  heading: ReactNode;
  subtext: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthCardShell({
  heading,
  subtext,
  children,
  footer,
}: AuthCardShellProps) {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
            <Dumbbell className="size-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-foreground">
            {heading}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {subtext}
          </p>
        </div>

        {children}
        {footer}
      </div>
    </div>
  );
}
