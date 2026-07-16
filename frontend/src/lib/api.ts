// In production the SPA and API are on different domains (Vercel/Render), so
// the refresh-token cookie would be a cross-site cookie and get blocked by
// browser tracking protections. Routing through Vercel's /api rewrite makes
// the API same-origin from the browser's perspective, keeping the cookie
// first-party.
export const BASE_URL = import.meta.env.PROD
  ? "/api"
  : (import.meta.env.VITE_API_URL ?? "http://localhost:4000");
const AUTH_SESSION_INVALIDATED_EVENT = "workout-tracker:session-invalidated";

let accessToken: string | null = null;
let accessTokenIssuedAt: number | null = null;
let refreshPromise: Promise<RefreshResult> | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
  // Every caller of this only ever passes a token it just received from the
  // backend (login/register/refresh), so "set" and "issued" are the same
  // moment — this is what lets isAccessTokenStale() judge real expiry instead
  // of mere presence.
  accessTokenIssuedAt = token ? Date.now() : null;
}

// Access tokens are signed with a 15-minute expiry (see backend/src/routes/auth.ts).
// Refreshing this early leaves margin for clock drift and in-flight request time.
const ACCESS_TOKEN_TTL_MS = 15 * 60 * 1000;
const ACCESS_TOKEN_REFRESH_MARGIN_MS = 60 * 1000;

// Whether the in-memory access token is missing or old enough that it's
// worth proactively refreshing (e.g. on tab-resume) rather than waiting for
// a request to 401. A token merely being *present* doesn't mean it's valid —
// this checks actual age against the known server-side TTL.
export function isAccessTokenStale(): boolean {
  if (!accessToken || accessTokenIssuedAt === null) return true;
  return (
    Date.now() - accessTokenIssuedAt >=
    ACCESS_TOKEN_TTL_MS - ACCESS_TOKEN_REFRESH_MARGIN_MS
  );
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

// Bounds a single network attempt so a hung connection can't stall retry
// logic indefinitely, and can't leave a caller's promise pending forever
// (the original stuck-loading-spinner bug). The timeout only guards until
// fetch() resolves (i.e. headers received) — clearTimeout() is exposed to
// the caller rather than called internally, so whoever ends up reading the
// response body can keep the same deadline alive through that read too, and
// a response that's discarded unread (e.g. superseded by a refresh retry)
// can release its timer immediately instead of leaving it dangling.
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<{ response: Response; clearTimeout: () => void }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  const signal = options.signal
    ? AbortSignal.any([options.signal, controller.signal])
    : controller.signal;

  try {
    const response = await fetch(url, { ...options, signal });
    return { response, clearTimeout: () => clearTimeout(timeoutId) };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

const REFRESH_TIMEOUT_MS = 8000;

async function requestRefresh(attempt = 1): Promise<RefreshResult> {
  let res: Response;
  let clearFetchTimeout: () => void;
  try {
    ({ response: res, clearTimeout: clearFetchTimeout } =
      await fetchWithTimeout(
        `${BASE_URL}/auth/refresh`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        },
        REFRESH_TIMEOUT_MS,
      ));
  } catch {
    return { status: "network-error" };
  }

  try {
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
    clearFetchTimeout();
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

// Without this, a request that stalls (dropped connection, a backend that
// never responds) leaves its fetch promise pending forever — React Query's
// isLoading never flips to false because there's nothing to retry or error
// on, so any UI driven by isLoading (e.g. the Today page's session button)
// looks permanently stuck rather than failing visibly.
const REQUEST_TIMEOUT_MS = 20000;

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

  let { response, clearTimeout: clearFetchTimeout } = await fetchWithTimeout(
    url,
    fetchOptions,
    REQUEST_TIMEOUT_MS,
  );

  // If unauthorized and we haven't skipped auth, attempt token refresh
  if (
    (response.status === 401 || response.status === 403) &&
    !options.skipAuth
  ) {
    const refreshed = await refreshSession();
    if (refreshed.status === "success") {
      // Discard the first attempt's response (its body is never read) and
      // switch to the retried response/timer for everything below.
      clearFetchTimeout();
      headers.set("Authorization", `Bearer ${refreshed.accessToken}`);
      ({ response, clearTimeout: clearFetchTimeout } = await fetchWithTimeout(
        url,
        fetchOptions,
        REQUEST_TIMEOUT_MS,
      ));
    }
    // Unauthorized refresh clears auth state through the session invalidated
    // event. Network failures keep the current session in memory so the UI can
    // retry once connectivity returns.
  }

  try {
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

    return await response.json();
  } finally {
    // Kept alive until here (not cleared right after fetch() resolved) so a
    // response that stalls mid-body-download still gets aborted instead of
    // hanging response.json() forever — the same failure mode this timeout
    // exists to prevent, just one step later in the request lifecycle.
    clearFetchTimeout();
  }
}
