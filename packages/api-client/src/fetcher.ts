// Custom fetch used by every generated endpoint function.
// - Prefixes the API base URL
// - Sends cookies (admin auth is httpOnly cookies)
// - Throws ApiError on non-2xx so TanStack Query can handle it

const BASE_URL =
  (typeof process !== 'undefined' &&
    (process.env.NEXT_PUBLIC_API_BASE_URL ?? process.env.API_BASE_URL)) ||
  'http://localhost:8000/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public body: unknown,
  ) {
    const detail =
      body && typeof body === 'object' && 'detail' in body && typeof body.detail === 'string'
        ? body.detail
        : `Request failed with status ${status}`;
    super(detail);
    this.name = 'ApiError';
  }
}

export const apiFetch = async <T>(url: string, options: RequestInit = {}): Promise<T> => {
  const res = await fetch(`${BASE_URL}${url}`, {
    credentials: 'include',
    ...options,
    headers: { Accept: 'application/json', ...options.headers },
  });

  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = res.status === 204 ? undefined : isJson ? await res.json() : await res.text();

  if (!res.ok) throw new ApiError(res.status, body);
  return { data: body, status: res.status, headers: res.headers } as T;
};
