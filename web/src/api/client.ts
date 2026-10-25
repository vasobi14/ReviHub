import { clearAccessToken, getAccessToken, refreshAccessToken } from './auth';

const API_URL = '/api';

interface ApiError extends Error {
  status?: number;
  code?: string;
}

async function parseBody(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function doFetch(
  path: string,
  options: RequestInit,
  withAuth: boolean,
): Promise<Response> {
  const headers = new Headers(options.headers);
  if (
    !headers.has('Content-Type') &&
    options.body &&
    !(options.body instanceof FormData)
  ) {
    headers.set('Content-Type', 'application/json');
  }
  if (withAuth) {
    const token = getAccessToken();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  let res = await doFetch(path, options, true);

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(path, options, true);
    } else {
      clearAccessToken();
    }
  }

  const data = await parseBody(res);

  if (!res.ok) {
    const payload = data as { message?: string; code?: string } | null;
    const error = new Error(
      payload?.message || res.statusText || 'Request failed',
    ) as ApiError;
    error.status = res.status;
    error.code = payload?.code;
    throw error;
  }

  return data as T;
}

export async function apiUpload<T>(
  path: string,
  formData: FormData,
  options: RequestInit = {},
): Promise<T> {
  let res = await doFetch(
    path,
    { ...options, method: options.method ?? 'POST', body: formData },
    true,
  );

  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      res = await doFetch(
        path,
        { ...options, method: options.method ?? 'POST', body: formData },
        true,
      );
    } else {
      clearAccessToken();
    }
  }

  const data = await parseBody(res);

  if (!res.ok) {
    const payload = data as {
      message?: string;
      code?: string;
    } | null;
    const error = new Error(
      payload?.message || res.statusText || 'Request failed',
    ) as ApiError;
    error.status = res.status;
    error.code = payload?.code;
    throw error;
  }

  return data as T;
}

export async function login(email: string, password: string) {
  const data = await apiFetch<{
    accessToken: string;
    user: import('./types').User;
  }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
}

export async function register(email: string, password: string, name?: string) {
  await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  });
}

export async function verifyEmail(email: string, code: string) {
  return apiFetch<{ success: boolean }>('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, code }),
  });
}

export async function resendVerification(email: string) {
  return apiFetch<{ success: boolean }>('/auth/resend-verification', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function fetchMe(): Promise<import('./types').User> {
  return apiFetch<import('./types').User>('/auth/me');
}

export async function logout() {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } catch {}
  clearAccessToken();
}

export function createTitle(data: {
  name: string;
  type: string;
  releaseYear?: number;
  description?: string;
  image?: File;
}) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('type', data.type);
  if (data.releaseYear !== undefined)
    formData.append('releaseYear', String(data.releaseYear));
  if (data.description !== undefined)
    formData.append('description', data.description);
  if (data.image) formData.append('image', data.image);

  return apiUpload<import('./types').Title>('/titles', formData);
}

export function updateTitle(
  id: number,
  data: {
    name: string;
    type: string;
    releaseYear?: number;
    description?: string;
    image?: File;
    removeImage?: boolean;
  },
) {
  const formData = new FormData();
  formData.append('name', data.name);
  formData.append('type', data.type);
  if (data.releaseYear !== undefined)
    formData.append('releaseYear', String(data.releaseYear));
  if (data.description !== undefined)
    formData.append('description', data.description);
  if (data.image) formData.append('image', data.image);
  if (data.removeImage !== undefined)
    formData.append('removeImage', String(data.removeImage));

  return apiUpload<import('./types').Title>(`/titles/${id}`, formData, {
    method: 'PUT',
  });
}

export function deleteTitle(id: number) {
  return apiFetch<void>(`/titles/${id}`, { method: 'DELETE' });
}

export function createReview(titleId: number, score: number, text: string) {
  return apiFetch<import('./types').Review>('/reviews', {
    method: 'POST',
    body: JSON.stringify({ titleId, score, text }),
  });
}

export function updateReview(
  id: number,
  data: { score: number; text: string },
) {
  return apiFetch<import('./types').Review>(`/reviews/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export function deleteReview(id: number) {
  return apiFetch(`/reviews/${id}`, { method: 'DELETE' });
}

export function fetchAdminUsers() {
  return apiFetch<import('./types').AdminUser[]>('/admin/users');
}

export function deleteAdminUser(id: number) {
  return apiFetch(`/admin/users/${id}`, { method: 'DELETE' });
}
