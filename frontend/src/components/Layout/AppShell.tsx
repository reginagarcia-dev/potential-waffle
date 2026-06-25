import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children?: ReactNode;
};

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col pb-20">
        {children ?? <Outlet />}
      </main>
      <BottomNav />
    </div>
  );
}
