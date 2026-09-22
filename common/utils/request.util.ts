import { DEFAULT_ERROR_MESSAGE, UserFacingError } from './error-message.util';

export type JsonRequestOptions = RequestInit & {
  baseUrl: string;
  parseError?: (response: Response) => Error | Promise<Error>;
};

export async function request<T>(path: string, options: JsonRequestOptions): Promise<T> {
  const { baseUrl, parseError, headers, ...init } = options;

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    credentials: init.credentials ?? 'include',
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw await (parseError?.(response) ?? defaultParseError(response));
  }

  return (await response.json()) as T;
}

async function defaultParseError(response: Response): Promise<Error> {
  console.error(`Request failed: ${response.status} ${response.statusText || '(no status text)'}`);
  return new UserFacingError(DEFAULT_ERROR_MESSAGE);
}
