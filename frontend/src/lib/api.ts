const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token: string | null) {
  accessToken = token;
}

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

async function refreshTokens(): Promise<string | null> {
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    const data = await res.json();
    setAccessToken(data.accessToken);
    return data.accessToken;
  } catch (error) {
    setAccessToken(null);
    return null;
  }
}

export async function apiFetch(path: string, options: RequestOptions = {}): Promise<any> {
  const url = `${BASE_URL}${path}`;
  
  // Set headers
  const headers = new Headers(options.headers || {});
  if (!options.skipAuth && accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
  };

  // If credentials are required (for cookies)
  fetchOptions.credentials = 'include';

  let response = await fetch(url, fetchOptions);

  // If unauthorized and we haven't skipped auth, attempt token refresh
  if ((response.status === 401 || response.status === 403) && !options.skipAuth) {
    // Deduplicate concurrent refresh requests
    if (!refreshPromise) {
      refreshPromise = refreshTokens().finally(() => {
        refreshPromise = null;
      });
    }

    const newAccessToken = await refreshPromise;
    if (newAccessToken) {
      // Retry with new token
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      response = await fetch(url, fetchOptions);
    } else {
      // Refresh failed, clean token and let caller handle authorization error
      setAccessToken(null);
    }
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody.error || `HTTP error! status: ${response.status}`);
  }

  // Handle empty responses
  if (response.status === 204) {
    return null;
  }

  return response.json();
}
