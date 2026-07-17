import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { ProductButton } from "@/components/ui/ProductButton";
import { Spinner } from "@/components/ui/Spinner";
import { AuthCardShell } from "@/components/Auth/AuthCardShell";
import { AuthTextField } from "@/components/Auth/AuthTextField";
import { AuthErrorBanner } from "@/components/Auth/AuthErrorBanner";

export function ContactPage() {
  const { user } = useAuth();
  const [email, setEmail] = useState(user?.email ?? "");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // user starts null and only populates once AuthProvider's silent-refresh
  // effect resolves — a direct page load of this route (vs. an in-app nav,
  // where user is already populated by the time this mounts) can render
  // before that finishes, leaving the initial useState above stuck on "".
  // Backfills once auth resolves, without clobbering anything already typed.
  useEffect(() => {
    if (user?.email) {
      setEmail((current) => current || user.email);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch("/contact", {
        method: "POST",
        body: JSON.stringify({ email, message }),
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
      heading={sent ? "Thanks for reaching out" : "Contact us"}
      subtext={
        sent
          ? "We've received your message and will get back to you soon."
          : "Questions, feedback, or bug reports — we'd love to hear from you."
      }
      footer={
        <div className="text-center text-sm">
          <Link
            to={user ? "/app" : "/"}
            className="inline-flex items-center gap-1.5 font-semibold text-primary hover:text-primary/80"
          >
            <ArrowLeft className="size-3.5" />
            {user ? "Back to app" : "Back home"}
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

          <div>
            <label
              htmlFor="message"
              className="block text-xs font-semibold text-muted-foreground"
            >
              Message
            </label>
            <textarea
              id="message"
              required
              maxLength={2000}
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="How can we help?"
              className="mt-1 block w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <ProductButton type="submit" fullWidth disabled={submitting}>
            {submitting ? <Spinner variant="button" /> : "Send Message"}
          </ProductButton>
        </form>
      )}
    </AuthCardShell>
  );
}

export default ContactPage;
