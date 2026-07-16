import * as Sentry from "@sentry/react";

const dsn = import.meta.env.VITE_SENTRY_DSN;

// Entirely opt-in: without a DSN, Sentry is never initialized and
// isSentryEnabled is false, so every capture call below becomes a no-op.
export const isSentryEnabled = Boolean(dsn);

export function initSentry() {
  if (!dsn) return;

  // Error capture only — no tracesSampleRate/integrations, since
  // performance tracing needs the browserTracingIntegration bundle and
  // isn't what this is for.
  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
  });
}

export function captureError(error: unknown, extra?: Record<string, unknown>) {
  if (!isSentryEnabled) return;
  Sentry.captureException(error, extra ? { extra } : undefined);
}
