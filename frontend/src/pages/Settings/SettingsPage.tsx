import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.js';
import { LogOut, Settings, Timer, ShieldCheck } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, logout, updateUserPreferences } = useAuth();
  const [unit, setUnit] = useState<'lbs' | 'kg'>(user?.preferredUnit || 'lbs');
  const [restSeconds, setRestSeconds] = useState(user?.defaultRestSeconds || 180);
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
      console.error('Failed to update preferences', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-zinc-900 pb-4">
        <h1 className="font-heading text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
          <Settings className="h-6 w-6 text-zinc-400" />
          Settings
        </h1>
        <p className="text-sm text-zinc-400">Configure your application settings</p>
      </div>

      {/* Preferences Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 space-y-5">
          {success && (
            <div className="rounded-lg bg-teal-500/10 p-3 text-xs text-teal-400 ring-1 ring-teal-500/20 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Settings updated successfully!
            </div>
          )}

          {/* Unit Toggle */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block">
              Weight Unit
            </label>
            <div className="grid grid-cols-2 gap-2 rounded-lg bg-zinc-950/50 p-1 border border-zinc-800/80">
              <button
                type="button"
                onClick={() => setUnit('lbs')}
                className={`rounded-md py-2 text-xs font-bold transition-all ${
                  unit === 'lbs'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
                    : 'text-zinc-550 hover:text-zinc-350'
                }`}
              >
                Pounds (lbs)
              </button>
              <button
                type="button"
                onClick={() => setUnit('kg')}
                className={`rounded-md py-2 text-xs font-bold transition-all ${
                  unit === 'kg'
                    ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-zinc-700'
                    : 'text-zinc-550 hover:text-zinc-350'
                }`}
              >
                Kilograms (kg)
              </button>
            </div>
          </div>

          {/* Rest Timer selection */}
          <div className="space-y-2">
            <label htmlFor="rest-seconds" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Timer className="h-3.5 w-3.5" />
              Default Rest Duration
            </label>
            <select
              id="rest-seconds"
              value={restSeconds}
              onChange={(e) => setRestSeconds(parseInt(e.target.value))}
              className="block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 text-sm text-white focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 font-bold"
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

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-xl bg-teal-600 px-4 py-3 text-sm font-bold text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
        >
          {submitting ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
          ) : (
            'Save Preferences'
          )}
        </button>
      </form>

      {/* Account Info / Logout */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-900/10 p-5 space-y-4">
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Logged in as</span>
          <span className="text-sm font-semibold text-white mt-0.5 block">{user?.email}</span>
        </div>

        <button
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 border border-zinc-800 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-950/20 hover:border-red-900/40"
        >
          <LogOut className="h-4 w-4" />
          Log Out
        </button>
      </div>
    </div>
  );
};
export default SettingsPage;
