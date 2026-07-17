import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.js";
import { ProductButton } from "@/components/ui/ProductButton";
import { Spinner } from "@/components/ui/Spinner";
import { AuthCardShell } from "@/components/Auth/AuthCardShell";
import { AuthTextField } from "@/components/Auth/AuthTextField";
import { AuthErrorBanner } from "@/components/Auth/AuthErrorBanner";

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register({ email, password });
      navigate("/app");
    } catch (err: any) {
      setError(
        err.message || "Registration failed. Email might already be in use.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthCardShell
      heading="Create an account"
      subtext="Start tracking your workout metrics today"
      footer={
        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            Already have an account?{" "}
          </span>
          <Link
            to="/login"
            className="font-semibold text-primary hover:text-primary/80"
          >
            Sign in
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
            label="Password (min 6 characters)"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={setPassword}
            placeholder="••••••••"
          />

          <AuthTextField
            id="confirm-password"
            name="confirm-password"
            label="Confirm Password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="••••••••"
          />
        </div>

        <ProductButton type="submit" fullWidth disabled={submitting}>
          {submitting ? <Spinner variant="button" /> : "Create Account"}
        </ProductButton>
      </form>
    </AuthCardShell>
  );
};
export default RegisterPage;
