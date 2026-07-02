import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppShell } from "@/components/Layout/AppShell";
import { AuthGuard } from "./components/Auth/AuthGuard";
import { AuthProvider } from "./context/AuthContext";
import { TodayPage } from "@/pages/Today/TodayPage";
import { ActiveSessionPage } from "@/pages/Session/ActiveSessionPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Import screens
import { LoginPage } from "./pages/Auth/LoginPage";
import { RegisterPage } from "./pages/Auth/RegisterPage";
import { ForgotPasswordPage } from "./pages/Auth/ForgotPasswordPage";
import { ResetPasswordPage } from "./pages/Auth/ResetPasswordPage";
import { StartWorkoutPage } from "./pages/Session/StartWorkoutPage";
import { WorkoutSummaryPage } from "./pages/Session/WorkoutSummaryPage";
import { HistoryPage } from "./pages/History/HistoryPage";
import { PastSessionPage } from "./pages/History/PastSessionPage";
import { ProgressPage } from "./pages/Progress/ProgressPage";
import { SettingsPage } from "./pages/Settings/SettingsPage";
import { PublicGuard } from "./components/Auth/PublicGuard";
import { RestTimerProvider } from "./context/RestTimerContext";

// Stable instance — must live outside the component so re-renders don't
// create a new client and wipe the React Query cache mid-session.
const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RestTimerProvider>
          <BrowserRouter>
            <ErrorBoundary>
            <Routes>
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

              {/* Private/Authenticated Routes */}
              <Route
                path="/"
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
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback Direct Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            </ErrorBoundary>
          </BrowserRouter>
        </RestTimerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
