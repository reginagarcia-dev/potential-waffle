import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Dumbbell } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-zinc-950 to-black px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8 backdrop-blur-xl">
        <div className="flex flex-col items-center justify-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 ring-1 ring-teal-500/30">
            <Dumbbell className="h-6 w-6" />
          </div>
          <h2 className="mt-6 text-center font-heading text-3xl font-extrabold tracking-tight text-white">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-zinc-400">
            Log in to continue tracking your workouts
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-400 ring-1 ring-red-500/20">
              {error}
            </div>
          )}

          <div className="space-y-4 rounded-md shadow-sm">
            <div>
              <label htmlFor="email-address" className="text-xs font-semibold text-zinc-400">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold text-zinc-400">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-lg border border-zinc-800 bg-zinc-950/50 px-3 py-2.5 text-white placeholder-zinc-500 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500 sm:text-sm"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="group relative flex w-full justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-zinc-950 disabled:opacity-50"
            >
              {submitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent border-white"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </div>
        </form>

        <div className="text-center text-sm">
          <span className="text-zinc-500">Don't have an account? </span>
          <Link to="/register" className="font-semibold text-teal-400 hover:text-teal-300">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
