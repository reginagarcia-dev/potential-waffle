import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ProductButton } from "@/components/ui/ProductButton";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
      setTimeout(() => navigate("/login"), 2500);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-danger">Invalid reset link. Please request a new one.</p>
          <Link to="/forgot-password" className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary/80">
            Request new link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-border bg-card p-8">
        <div className="flex flex-col items-center justify-center">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30">
            <Dumbbell className="size-6" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-semibold tracking-tight text-foreground">
            {done ? "Password updated" : "Set new password"}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {done
              ? "Your password has been reset. Redirecting to login…"
              : "Choose a strong password for your account."}
          </p>
        </div>

        {!done && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger ring-1 ring-danger/20">
                {error}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-muted-foreground">
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="Min. 8 characters"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-xs font-semibold text-muted-foreground">
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <ProductButton type="submit" fullWidth disabled={submitting}>
              {submitting ? (
                <div className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                "Reset Password"
              )}
            </ProductButton>
          </form>
        )}

        {!done && (
          <div className="text-center text-sm">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80"
            >
              <ArrowLeft className="size-3.5" />
              Back to login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default ResetPasswordPage;
