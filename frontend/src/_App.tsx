import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { RestTimerProvider } from './context/RestTimerContext';
import { AuthGuard } from './components/Auth/AuthGuard';
import { PublicGuard } from './components/Auth/PublicGuard';
import { AppLayout } from './components/Layout/AppLayout';

// Import screens
import { LoginPage } from './pages/Auth/LoginPage';
import { RegisterPage } from './pages/Auth/RegisterPage';
import { TodayPage } from './pages/Today/TodayPage';
import { StartWorkoutPage } from './pages/Session/StartWorkoutPage';
import { ActiveSessionPage } from './pages/Session/ActiveSessionPage';
import { WorkoutSummaryPage } from './pages/Session/WorkoutSummaryPage';
import { HistoryPage } from './pages/History/HistoryPage';
import { PastSessionPage } from './pages/History/PastSessionPage';
import { ProgressPage } from './pages/Progress/ProgressPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RestTimerProvider>
          <BrowserRouter>
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

              {/* Private/Authenticated Routes */}
              <Route
                path="/"
                element={
                  <AuthGuard>
                    <AppLayout />
                  </AuthGuard>
                }
              >
                <Route index element={<TodayPage />} />
                <Route path="session/new" element={<StartWorkoutPage />} />
                <Route path="session/:id" element={<ActiveSessionPage />} />
                <Route path="session/:id/summary" element={<WorkoutSummaryPage />} />
                <Route path="history" element={<HistoryPage />} />
                <Route path="history/:id" element={<PastSessionPage />} />
                <Route path="progress" element={<ProgressPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              {/* Fallback Direct Redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </RestTimerProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
