import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AppShell } from "@/components/Layout/AppShell";
import { AuthGuard } from "./components/Auth/AuthGuard";
import { AuthProvider } from "./context/AuthContext";
import {
  QueryCache,
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { PublicGuard } from "./components/Auth/PublicGuard";
import { Spinner } from "@/components/ui/Spinner";
import { captureError } from "@/lib/sentry";
import { Analytics } from "@vercel/analytics/react";
// Route-level code splitting: each page (and whatever it pulls in — e.g.
// recharts via ProgressPage) only downloads when that route is actually
// visited, instead of every page being bundled into the initial load.
const TodayPage = lazy(() =>
  import("@/pages/Today/TodayPage").then((m) => ({ default: m.TodayPage })),
);
const ActiveSessionPage = lazy(() =>
  import("@/pages/Session/ActiveSessionPage").then((m) => ({
    default: m.ActiveSessionPage,
  })),
);
const LoginPage = lazy(() => import("./pages/Auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/Auth/RegisterPage"));
const ForgotPasswordPage = lazy(
  () => import("./pages/Auth/ForgotPasswordPage"),
);
const ResetPasswordPage = lazy(() => import("./pages/Auth/ResetPasswordPage"));
const MarketingPage = lazy(() => import("./pages/Marketing/MarketingPage"));
const ContactPage = lazy(() => import("./pages/Contact/ContactPage"));
const StartWorkoutPage = lazy(() => import("./pages/Session/StartWorkoutPage"));
const WorkoutSummaryPage = lazy(
  () => import("./pages/Session/WorkoutSummaryPage"),
);
const HistoryPage = lazy(() => import("./pages/History/HistoryPage"));
const PastSessionPage = lazy(() => import("./pages/History/PastSessionPage"));
const ProgressPage = lazy(() => import("./pages/Progress/ProgressPage"));
const MeasurementsPage = lazy(
  () => import("./pages/Measurements/MeasurementsPage"),
);
const SettingsPage = lazy(() => import("./pages/Settings/SettingsPage"));

// Stable instance — must live outside the component so re-renders don't
// create a new client and wipe the React Query cache mid-session. Errors
// are reported here (rather than at each call site) so every failed
// query/mutation is captured once, regardless of whether the component
// that triggered it also handles its own isError state.
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => captureError(error),
  }),
  mutationCache: new MutationCache({
    onError: (error) => captureError(error),
  }),
});

function RouteFallback() {
  return <Spinner variant="fullscreen" />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<RouteFallback />}>
              <Routes>
                <Route path="/" element={<MarketingPage />} />

                {/* Guest/Unauthenticated Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicGuard>
                      <LoginPage />
                    </PublicGuard>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicGuard>
                      <RegisterPage />
                    </PublicGuard>
                  }
                />
                <Route
                  path="/forgot-password"
                  element={
                    <PublicGuard>
                      <ForgotPasswordPage />
                    </PublicGuard>
                  }
                />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/contact" element={<ContactPage />} />

                {/* Private/Authenticated Routes */}
                <Route
                  path="/app"
                  element={
                    <AuthGuard>
                      <AppShell />
                    </AuthGuard>
                  }
                >
                  <Route index element={<TodayPage />} />
                  <Route path="session/new" element={<StartWorkoutPage />} />
                  <Route path="session/:id" element={<ActiveSessionPage />} />
                  <Route
                    path="session/:id/summary"
                    element={<WorkoutSummaryPage />}
                  />
                  <Route path="history" element={<HistoryPage />} />
                  <Route path="history/:id" element={<PastSessionPage />} />
                  <Route path="progress" element={<ProgressPage />} />
                  <Route path="measurements" element={<MeasurementsPage />} />
                  <Route path="settings" element={<SettingsPage />} />
                </Route>

                {/* Fallback Direct Redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
      <Analytics />
    </QueryClientProvider>
  );
}
