import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { ProductButton } from "@/components/ui/ProductButton";
import { Spinner } from "@/components/ui/Spinner";
import { AuthCardShell } from "@/components/Auth/AuthCardShell";
import { AuthTextField } from "@/components/Auth/AuthTextField";
import { AuthErrorBanner } from "@/components/Auth/AuthErrorBanner";

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
    <AuthCardShell
      heading={sent ? "Check your email" : "Forgot password?"}
      subtext={
        sent
          ? `We sent a reset link to ${email}. It expires in 1 hour.`
          : "Enter your email and we'll send you a reset link."
      }
      footer={
        <div className="text-center text-sm">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-3.5" />
            Back to login
          </Link>
        </div>
      }
    >
      {!sent && (
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && <AuthErrorBanner message={error} />}

          <AuthTextField
            id="email"
            label="Email Address"
            type="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />

          <ProductButton type="submit" fullWidth disabled={submitting}>
            {submitting ? <Spinner variant="button" /> : "Send Reset Link"}
          </ProductButton>
        </form>
      )}
    </AuthCardShell>
  );
}

export default ForgotPasswordPage;
