// src/shared/api/auth-client.ts

const API_URL = '/api';

function extractFastApiError(payload: any, fallback: string) {
  const detail = payload?.detail;

  // HTTPException: detail строкой или объектом {code,message}
  if (typeof detail === 'string') return detail;
  if (detail && typeof detail === 'object' && !Array.isArray(detail)) {
    return detail.message ?? JSON.stringify(detail);
  }

  // RequestValidationError: detail = массив ошибок
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const field =
      Array.isArray(first?.loc) ? first.loc.slice(-1)[0] : 'field';
    const msg = first?.msg ?? 'Validation error';
    return `${field}: ${msg}`;
  }

  return fallback;
}



export async function register(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  const rawText = await res.text();
  let payload: any = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    throw new Error(extractFastApiError(payload, `Register failed (${res.status})`));
  }

  // успех: { message: "..." }
  return payload;
}


export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  // читаем тело ВСЕГДА, иначе на ошибке не достанешь detail
  const rawText = await res.text();

  let payload: any = null;
  try {
    payload = rawText ? JSON.parse(rawText) : null;
  } catch {
    payload = null;
  }

  if (!res.ok) {
    // FastAPI HTTPException: {"detail": "..."} или {"detail": {code,message}}
    const msg =
      payload?.detail?.message ??
      payload?.detail ??
      rawText ??
      `Login failed (${res.status})`;

    throw new Error(String(msg));
  }

  // успешный ответ (ожидаем JSON с токенами)
  const data = payload;

  localStorage.setItem('access_token', data.access_token);
  localStorage.setItem('refresh_token', data.refresh_token);

  return data;
}


export async function getMe(token: string) {
  const res = await fetch(`${API_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Unauthorized');
  return res.json();
}
