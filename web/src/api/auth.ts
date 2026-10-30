const API_URL = '/api';
const REFRESH_LOCK_NAME = 'revihub-refresh-token';

type AuthChannelMessage =
  | { type: 'refreshed'; sender: string; accessToken: string }
  | { type: 'logout'; sender: string };

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

const tabId = `${Date.now()}-${Math.random()}`;
const authChannel =
  typeof BroadcastChannel === 'undefined'
    ? null
    : new BroadcastChannel('revihub-auth');

function notifyLogout(): void {
  window.dispatchEvent(new Event('auth:logout'));
}

authChannel?.addEventListener('message', (event: MessageEvent<unknown>) => {
  const message = event.data as Partial<AuthChannelMessage> | null;
  if (!message || message.sender === tabId) return;

  if (message.type === 'refreshed' && typeof message.accessToken === 'string') {
    accessToken = message.accessToken;
  }

  if (message.type === 'logout') {
    accessToken = null;
    notifyLogout();
  }
});

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function clearAccessToken(): void {
  accessToken = null;
}

export function logoutAcrossTabs(): void {
  accessToken = null;
  authChannel?.postMessage({
    type: 'logout',
    sender: tabId,
  } satisfies AuthChannelMessage);
  notifyLogout();
}

async function requestRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      accessToken = null;
      notifyLogout();
      return null;
    }

    const data = (await res.json()) as { accessToken: string };
    accessToken = data.accessToken;
    authChannel?.postMessage({
      type: 'refreshed',
      sender: tabId,
      accessToken,
    } satisfies AuthChannelMessage);

    await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
    return accessToken;
  } catch {
    accessToken = null;
    notifyLogout();
    return null;
  }
}

async function refreshWithLock(tokenBeforeRefresh: string | null) {
  if (typeof navigator === 'undefined' || !navigator.locks) {
    return requestRefresh();
  }

  return navigator.locks.request(REFRESH_LOCK_NAME, async () => {
    if (accessToken !== tokenBeforeRefresh) return accessToken;
    return requestRefresh();
  });
}

export async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  const tokenBeforeRefresh = accessToken;
  refreshPromise = refreshWithLock(tokenBeforeRefresh).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}
