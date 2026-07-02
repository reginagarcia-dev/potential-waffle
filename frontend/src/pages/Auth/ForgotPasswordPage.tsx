import { useState } from "react";
import { Link } from "react-router-dom";
import { Dumbbell, ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ProductButton } from "@/components/ui/ProductButton";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
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
            {sent ? "Check your email" : "Forgot password?"}
          </h2>
          <p className="mt-2 text-center text-sm text-muted-foreground">
            {sent
              ? `We sent a reset link to ${email}. It expires in 1 hour.`
              : "Enter your email and we'll send you a reset link."}
          </p>
        </div>

        {!sent && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="rounded-lg bg-danger/10 p-3 text-sm text-danger ring-1 ring-danger/20">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-muted-foreground">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="you@example.com"
              />
            </div>

            <ProductButton type="submit" fullWidth disabled={submitting}>
              {submitting ? (
                <div className="size-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                "Send Reset Link"
              )}
            </ProductButton>
          </form>
        )}

        <div className="text-center text-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
