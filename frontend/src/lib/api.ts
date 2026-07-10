// In production the SPA and API are on different domains (Vercel/Render), so
// the refresh-token cookie would be a cross-site cookie and get blocked by
// browser tracking protections. Routing through Vercel's /api rewrite makes
// the API same-origin from the browser's perspective, keeping the cookie
// first-party.
const BASE_URL = import.meta.env.PROD
  ? "/api"
  : (import.meta.env.VITE_API_URL ?? "http://localhost:4000");
const AUTH_SESSION_INVALIDATED_EVENT = "workout-tracker:session-invalidated";

let accessToken: string | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

interface RefreshResponse {
  accessToken: string;
  user: unknown;
}

type RefreshResult =
  | { status: "success"; accessToken: string; user: unknown }
  | { status: "unauthorized" }
  | { status: "network-error" };

function notifySessionInvalidated() {
  if (typeof window === "undefined") return;

  window.dispatchEvent(new Event(AUTH_SESSION_INVALIDATED_EVENT));
}

export function onSessionInvalidated(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  window.addEventListener(AUTH_SESSION_INVALIDATED_EVENT, listener);
  return () =>
    window.removeEventListener(AUTH_SESSION_INVALIDATED_EVENT, listener);
}

// Bounds a single attempt so a hung connection can't stall retry logic
// indefinitely — refreshSessionWithRetry's backoff math assumes each attempt
// fails fast, not that it hangs until some browser/OS-level timeout.
const REFRESH_TIMEOUT_MS = 8000;

async function requestRefresh(attempt = 1): Promise<RefreshResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REFRESH_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      if (res.status === 401 || res.status === 403) {
        // Some environments can produce intermittent unauthorized refresh
        // responses (cookie timing, transient infra blips). Confirm once more
        // before clearing local auth state.
        if (attempt < 2) {
          return requestRefresh(attempt + 1);
        }

        setAccessToken(null);
        notifySessionInvalidated();
        return { status: "unauthorized" };
      }

      return { status: "network-error" };
    }

    const data: RefreshResponse = await res.json();
    setAccessToken(data.accessToken);
    return {
      status: "success",
      accessToken: data.accessToken,
      user: data.user,
    };
  } catch {
    return { status: "network-error" };
  } finally {
    clearTimeout(timeoutId);
  }
}

// Single-flight refresh: concurrent callers (401 retries, tab-resume
// re-auth) share one in-flight request instead of racing each other.
export function refreshSession(): Promise<RefreshResult> {
  if (!refreshPromise) {
    refreshPromise = requestRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// A "network-error" here isn't necessarily a dead session — it can also be a
// backend that's still waking up from an idle scale-down, or a one-off
// connectivity blip. Only unauthorized/success are treated as definitive, so
// callers that would otherwise log the user out on page load (silent login,
// tab-resume) get a few spaced-out attempts before giving up.
export async function refreshSessionWithRetry(
  maxAttempts = 4,
  baseDelayMs = 1500,
): Promise<RefreshResult> {
  let result = await refreshSession();
  for (
    let attempt = 1;
    attempt < maxAttempts && result.status === "network-error";
    attempt++
  ) {
    await new Promise((resolve) => setTimeout(resolve, baseDelayMs * attempt));
    result = await refreshSession();
  }
  return result;
}

export async function apiFetch(
  path: string,
  options: RequestOptions = {},
): Promise<any> {
  const url = `${BASE_URL}${path}`;

  // Set headers
  const headers = new Headers(options.headers || {});
  if (!options.skipAuth && accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // If credentials are required (for cookies)
  fetchOptions.credentials = "include";

  let response = await fetch(url, fetchOptions);

  // If unauthorized and we haven't skipped auth, attempt token refresh
  if (
    (response.status === 401 || response.status === 403) &&
    !options.skipAuth
  ) {
    const refreshed = await refreshSession();
    if (refreshed.status === "success") {
      // Retry with new token
      headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
      response = await fetch(url, fetchOptions);
    }
    // Unauthorized refresh clears auth state through the session invalidated
    // event. Network failures keep the current session in memory so the UI can
    // retry once connectivity returns.
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.error || `HTTP error! status: ${response.status}`,
    );
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
