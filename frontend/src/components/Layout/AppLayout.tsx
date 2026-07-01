import React from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import { Dumbbell, History, TrendingUp, Settings } from 'lucide-react';
import { RestTimerBar } from '../ActiveSession/RestTimerBar.js';

export const AppLayout: React.FC = () => {
  const location = useLocation();

  // Hide the navigation bottom bar on login, register, and active session routes
  const hideNav = 
    location.pathname.startsWith('/login') || 
    location.pathname.startsWith('/register') || 
    location.pathname.match(/\/session\/[a-f0-9-]{36}$/i); // matches UUID session routes

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6 pb-32">
        <div className="mx-auto max-w-lg">
          <Outlet />
        </div>
      </main>

      {/* Sticky rest timer */}
      <RestTimerBar />

      {/* Navigation bottom bar */}
      {!hideNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/90 py-2.5 backdrop-blur-lg safe-bottom">
          <div className="mx-auto flex max-w-lg items-center justify-around">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Dumbbell className="h-5 w-5" />
              <span>Today</span>
            </NavLink>

            <NavLink
              to="/history"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <History className="h-5 w-5" />
              <span>History</span>
            </NavLink>

            <NavLink
              to="/progress"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <TrendingUp className="h-5 w-5" />
              <span>Progress</span>
            </NavLink>

            <NavLink
              to="/settings"
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`
              }
            >
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </NavLink>
          </div>
        </nav>
      )}
    </div>
  );
};
export default AppLayout;
