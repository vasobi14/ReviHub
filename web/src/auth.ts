const API_URL = '/api';

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });

      if (!res.ok) {
        accessToken = null;
        window.dispatchEvent(new Event('auth:logout'));
        return null;
      }

      const data = (await res.json()) as { accessToken: string };
      accessToken = data.accessToken;
      return accessToken;
    } catch {
      accessToken = null;
      window.dispatchEvent(new Event('auth:logout'));
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}
