import { authsApiBaseHref } from '@common/app-urls';
import type { AuthUser, MeUser } from '@common/auth-types';
import { request } from '@common/utils/request.util';

import { authsServiceBase } from './url-bases';
import { AuthApiError, type ErrorBody } from '../types/error';

const apiBase = authsApiBaseHref(authsServiceBase);

export function register(username: string, password: string): Promise<{ user: AuthUser }> {
  return authsRequest('/sign-up', {
    method: 'POST',
    body: JSON.stringify({
      username,
      password,
      // Hints for the starting preferences.
      locale: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    }),
  });
}

export function login(username: string, password: string): Promise<{ user: AuthUser }> {
  return authsRequest('/sign-in', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export function getMe(): Promise<MeUser> {
  return authsRequest('/me');
}

export function logout(): Promise<void> {
  return authsRequest('/sign-out', { method: 'POST' });
}

function authsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    baseUrl: apiBase,
    parseError: authApiErrorFrom,
  });
}

async function authApiErrorFrom(response: Response): Promise<AuthApiError> {
  let body: ErrorBody = {};
  try {
    body = (await response.json()) as ErrorBody;
  } catch {
    // non-JSON error body
  }

  const fieldErrors: Record<string, string> = {};
  for (const detail of body.details ?? []) {
    if (detail.path && fieldErrors[detail.path] === undefined) {
      fieldErrors[detail.path] = detail.message;
    }
  }

  if (response.status === 409 && fieldErrors.username === undefined) {
    fieldErrors.username = body.error ?? 'Username already taken';
  }

  return new AuthApiError(response.status, body.error ?? 'Request failed', fieldErrors);
}
