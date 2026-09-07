const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface ApiErrorBody {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

function parseErrorText(status: number, text: string): { code: string; message: string; details?: unknown } {
  try {
    const parsed = JSON.parse(text) as ApiErrorBody | { success: true };
    if (parsed && !parsed.success && 'error' in parsed) {
      return parsed.error;
    }
  } catch {
    // fall through
  }
  return { code: 'REQUEST_FAILED', message: `Request failed with status ${status}.` };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    const { code, message, details } = parseErrorText(response.status, text);
    throw new ApiRequestError(response.status, code, message, details);
  }

  if (!text) return {} as T;
  const body = JSON.parse(text) as { success: boolean; data?: T };
  return body.data ?? ({} as T);
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};