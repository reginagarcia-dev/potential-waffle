import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import { ProductButton } from "@/components/ui/ProductButton";
import { Spinner } from "@/components/ui/Spinner";
import { AuthCardShell } from "@/components/Auth/AuthCardShell";
import { AuthTextField } from "@/components/Auth/AuthTextField";
import { AuthErrorBanner } from "@/components/Auth/AuthErrorBanner";
import { useSeo } from "@/lib/seo";

export const LoginPage: React.FC = () => {
  useSeo({ title: "Log in — ArqLift", noindex: true });
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login({ email, password });
      navigate("/app");
    } catch (err: any) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardShell
      heading="Welcome back"
      subtext="Log in to continue tracking your workouts"
      footer={
        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link
            to="/register"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Sign up
          </Link>
        </div>
      }
    >
      <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
        {error && <AuthErrorBanner message={error} />}

        <div className="space-y-4">
          <AuthTextField
            id="email-address"
            name="email"
            label="Email Address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={setEmail}
            placeholder="you@example.com"
          />

          <AuthTextField
            id="password"
            name="password"
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />
        </div>

        <ProductButton type="submit" fullWidth disabled={submitting}>
          {submitting ? <Spinner variant="button" /> : "Sign In"}
        </ProductButton>

        <div className="text-center">
          <Link
            to="/forgot-password"
            className="text-xs font-semibold text-primary hover:text-primary/80"
          >
            Forgot password?
          </Link>
        </div>
      </form>
    </AuthCardShell>
  );
};
export default LoginPage;
