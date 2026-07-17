import { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ProductButton } from "@/components/ui/ProductButton";
import { Spinner } from "@/components/ui/Spinner";
import { AuthCardShell } from "@/components/Auth/AuthCardShell";
import { AuthTextField } from "@/components/Auth/AuthTextField";
import { AuthErrorBanner } from "@/components/Auth/AuthErrorBanner";
import { useSeo } from "@/lib/seo";

export function ResetPasswordPage() {
  useSeo({ title: "Reset password — ArqLift", noindex: true });
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
    <AuthCardShell
      heading={done ? "Password updated" : "Set new password"}
      subtext={
        done
          ? "Your password has been reset. Redirecting to login…"
          : "Choose a strong password for your account."
      }
      footer={
        !done && (
          <div className="text-center text-sm">
            <Link
              to="/login"
              className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80"
            >
              <ArrowLeft className="size-3.5" />
              Back to login
            </Link>
          </div>
        )
      }
    >
      {!done && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <AuthErrorBanner message={error} />}

          <div className="space-y-4">
            <AuthTextField
              id="password"
              label="New Password"
              type="password"
              required
              minLength={8}
              value={password}
              onChange={setPassword}
              placeholder="Min. 8 characters"
            />
            <AuthTextField
              id="confirm"
              label="Confirm Password"
              type="password"
              required
              value={confirm}
              onChange={setConfirm}
              placeholder="••••••••"
            />
          </div>

          <ProductButton type="submit" fullWidth disabled={submitting}>
            {submitting ? <Spinner variant="button" /> : "Reset Password"}
          </ProductButton>
        </form>
      )}
    </AuthCardShell>
  );
}

export default ResetPasswordPage;
