import type { ReactNode } from "react";
import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

type AppShellProps = {
  children?: ReactNode;
};

// A route-level Suspense boundary lives here, not around the whole <Routes>
// tree, so that loading a not-yet-fetched lazy page only shows this inline
// spinner in the content area — BottomNav (outside this boundary) stays
// mounted and tappable instead of the whole screen flashing to a full-page
// spinner on every first visit to a route.
function PageFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-20 text-primary">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent border-primary"></div>
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-dvh overflow-x-auto bg-background text-foreground">
      <main className="mx-auto flex min-h-dvh w-full min-w-[320px] max-w-md flex-col pb-20">
        {/* Pushes content below the notch/dynamic island without inflating the scroll container */}
        <div className="h-[env(safe-area-inset-top)] shrink-0" />
        <Suspense fallback={<PageFallback />}>{children ?? <Outlet />}</Suspense>
      </main>
      <BottomNav />
    </div>
  );
}
