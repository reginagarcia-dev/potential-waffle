import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext.js";
import { LogOut, Timer, ShieldCheck } from "lucide-react";
import { ProductButton } from "@/components/ui/ProductButton";

export const SettingsPage: React.FC = () => {
  const { user, logout, updateUserPreferences } = useAuth();
  const [unit, setUnit] = useState<"lbs" | "kg">(user?.preferredUnit || "lbs");
  const [restSeconds, setRestSeconds] = useState(
    user?.defaultRestSeconds || 180,
  );
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccess(false);
    try {
      await updateUserPreferences(unit, restSeconds);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update preferences", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 px-4">
      <div className="sticky top-[env(safe-area-inset-top)] z-10 -mx-4 border-b border-border bg-background px-4 pt-6 pb-4">
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
          {/* <Settings className="size-6 text-muted-foreground" /> */}
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure your application settings
        </p>
      </div>

      {/* Preferences Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-5 space-y-5">
          {success && (
            <div className="rounded-lg bg-accent/10 p-3 text-xs text-accent ring-1 ring-accent/20 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Settings updated successfully!
            </div>
          )}

          {/* Unit Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
              Weight Unit
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-surface p-1 border border-border">
              <button
                type="button"
                onClick={() => setUnit("lbs")}
                className={`rounded-md py-2 text-xs font-bold transition-all ${
                  unit === "lbs"
                    ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pounds (lbs)
              </button>
              <button
                type="button"
                onClick={() => setUnit("kg")}
                className={`rounded-md py-2 text-xs font-bold transition-all ${
                  unit === "kg"
                    ? "bg-muted text-foreground shadow-sm ring-1 ring-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Kilograms (kg)
              </button>
            </div>
          </div>

          {/* Rest Timer selection */}
          <div className="space-y-2">
            <label
              htmlFor="rest-seconds"
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5"
            >
              <Timer className="h-3.5 w-3.5" />
              Default Rest Duration
            </label>
            <select
              id="rest-seconds"
              value={restSeconds}
              onChange={(e) => setRestSeconds(parseInt(e.target.value))}
              className="block w-full rounded-lg border border-input bg-surface px-3 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring font-bold"
            >
              <option value={60}>1 minute</option>
              <option value={90}>1 min 30s</option>
              <option value={120}>2 minutes</option>
              <option value={150}>2 mins 30s</option>
              <option value={180}>3 minutes</option>
              <option value={240}>4 minutes</option>
              <option value={300}>5 minutes</option>
            </select>
          </div>
        </div>

        <ProductButton type="submit" fullWidth disabled={submitting}>
          {submitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-primary-foreground"></div>
          ) : (
            "Save Preferences"
          )}
        </ProductButton>
      </form>

      {/* Account Info / Logout */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-4">
        <div>
          <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Logged in as
          </span>
          <span className="text-sm font-semibold text-foreground mt-0.5 block">
            {user?.email}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold text-destructive transition hover:bg-destructive/10 hover:border-destructive/30 focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};
export default SettingsPage;
