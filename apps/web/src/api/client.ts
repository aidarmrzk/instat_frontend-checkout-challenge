import { AppError } from './errors';

type ApiEnvelope<T> = {
  data: T;
  meta: { requestId: string };
  links: Record<string, { href: string; method: 'GET' | 'POST' | 'PUT' | 'DELETE' }>;
};

type ApiErrorEnvelope = {
  error: {
    code: string;
    message: string;
    fields?: Array<{ path: string; message: string }>;
  };
  meta: { requestId: string };
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:4000';
const DEFAULT_HEADERS = {
  Accept: 'application/json',
} as const;

let authToken: string | null = null;

export const setAuthToken = (token: string | null): void => {
  authToken = token;
};

const buildUrl = (path: string): string => {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  if (!path.startsWith('/')) {
    return `${API_BASE_URL}/${path}`;
  }

  return `${API_BASE_URL}${path}`;
};

const isEnvelope = <T>(value: unknown): value is ApiEnvelope<T> => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'data' in value && 'meta' in value && 'links' in value;
};

const isErrorEnvelope = (value: unknown): value is ApiErrorEnvelope => {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return 'error' in value && 'meta' in value;
};

export async function apiRequest<T>(params: {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
}): Promise<{ data: T; requestId: string; status: number; headers: Headers }> {
  const headers = new Headers(DEFAULT_HEADERS);

  if (params.body !== undefined && (params.method === 'GET' || params.method === 'DELETE')) {
    throw new AppError({
      message: `Method ${params.method} does not accept request body.`,
      code: 'CLIENT_BODY_NOT_ALLOWED',
      status: 0,
      kind: 'parse',
    });
  }

  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  if (params.idempotencyKey) {
    headers.set('Idempotency-Key', params.idempotencyKey);
  }

  const init: RequestInit = {
    method: params.method,
    headers,
    signal: params.signal,
  };

  if (params.body !== undefined) {
    headers.set('Content-Type', 'application/json');
    init.body = JSON.stringify(params.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(params.path), init);
  } catch {
    throw new AppError({
      message: 'Network error. Check your connection and try again.',
      code: 'NETWORK_ERROR',
      status: 0,
      kind: 'network',
    });
  }

  if (response.status === 204) {
    return {
      data: undefined as T,
      requestId: response.headers.get('X-Request-Id') ?? '',
      status: response.status,
      headers: response.headers,
    };
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new AppError({
      message: 'Failed to parse server response.',
      code: 'INVALID_JSON',
      status: response.status,
      kind: 'parse',
    });
  }

  if (!response.ok) {
    if (isErrorEnvelope(payload)) {
      throw new AppError({
        message: payload.error.message,
        code: payload.error.code,
        status: response.status,
        requestId: payload.meta.requestId,
        fields: payload.error.fields,
        kind: 'http',
      });
    }

    throw new AppError({
      message: 'Request failed.',
      code: 'HTTP_ERROR',
      status: response.status,
      kind: 'http',
    });
  }

  if (!isEnvelope<T>(payload)) {
    throw new AppError({
      message: 'Response has unexpected format.',
      code: 'INVALID_ENVELOPE',
      status: response.status,
      kind: 'parse',
    });
  }

  return {
    data: payload.data,
    requestId: payload.meta.requestId,
    status: response.status,
    headers: response.headers,
  };
}
