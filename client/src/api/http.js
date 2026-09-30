const API_URL = import.meta.env.VITE_API_URL || '/api';

// Normalised error so every form can show field errors the same way.
export class ApiError extends Error {
  constructor(status, code, message, fields = {}) {
    super(message);
    Object.assign(this, { status, code, fields });
  }
}

export async function http(path, { method = 'GET', body, isForm = false } = {}) {
  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: 'include',
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch {
    throw new ApiError(0, 'NETWORK', 'Cannot reach the server. Check your connection.');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = data.error || {};
    throw new ApiError(res.status, e.code || 'UNKNOWN', e.message || 'Request failed', e.fields || {});
  }
  return data;
}

export const fileUrl = (p) => (p ? API_URL.replace(/\/api$/, '') + p : null);
