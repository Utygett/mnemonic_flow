// Low-level HTTP request helper
// No domain types - only technical concerns

export class ApiError extends Error {
  status: number;
  detail?: string;

  constructor(status: number, message: string, detail?: string) {
    super(message);
    this.status = status;
    this.detail = detail;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

async function refreshAccessToken(): Promise<string> {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) throw new ApiError(401, 'No refresh token');

  const res = await fetch(`/api/auth/refresh`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${refresh}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const j = await res.json();
      detail = typeof j?.detail === 'string' ? j.detail : undefined;
    } catch {
      // ignore
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    throw new ApiError(res.status, detail || `HTTP ${res.status}`, detail);
  }

  const data = await res.json();
  const newAccess = String(data?.access_token ?? '');
  const newRefresh = String(data?.refresh_token ?? refresh);

  if (!newAccess) throw new ApiError(500, 'Refresh returned empty access_token');

  localStorage.setItem('access_token', newAccess);
  localStorage.setItem('refresh_token', newRefresh);

  return newAccess;
}

export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = async () => {
    const token = localStorage.getItem('access_token');

    return fetch(`/api${path}`, {
      ...init,
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
        ...(init?.headers ?? {}),
      },
    });
  };

  let res = await doFetch();

  // Retry once on 401 with token refresh
  if (res.status === 401) {
    try {
      await refreshAccessToken();
      res = await doFetch();
    } catch (e) {
      throw e;
    }
  }

  if (!res.ok) {
    let detail: string | undefined;
    try {
      const j = await res.json();
      detail = typeof j?.detail === 'string' ? j.detail : undefined;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, detail || `HTTP ${res.status}`, detail);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
