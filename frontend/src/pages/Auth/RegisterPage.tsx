import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.js';
import { Dumbbell } from 'lucide-react';
import { ProductButton } from '@/components/ui/ProductButton';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password });
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Email might already be in use.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
            <Dumbbell className="size-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-foreground">
            Create an account
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            Start tracking your workout metrics today
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger ring-1 ring-danger/20">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-xs font-semibold text-muted-foreground">
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
                className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground">
                Password (min 6 characters)
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-xs font-semibold text-muted-foreground">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="••••••••"
              />
            </div>
          </div>

          <ProductButton type="submit" fullWidth disabled={submitting}>
            {submitting ? (
              <div className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              'Create Account'
            )}
          </ProductButton>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
export default RegisterPage;
