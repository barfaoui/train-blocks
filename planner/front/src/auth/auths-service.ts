import { authsApiBaseHref } from '@common/app-urls';
import type {
  MeUser,
  PreferenceCategoryId,
  UpdateAvatarBody,
  UpdateDisplayNameBody,
  UpdatePreferencesBody,
} from '@common/auth-types';
import { DEFAULT_ERROR_MESSAGE, UserFacingError } from '@common/utils/error-message.util';
import { request } from '@common/utils/request.util';

import { authsServiceBase } from './url-bases';

const apiBase = authsApiBaseHref(authsServiceBase);

export function getMe(): Promise<MeUser> {
  return authsRequest('/me');
}

export function updateAvatar(avatar: UpdateAvatarBody): Promise<MeUser> {
  return authsRequest('/me/avatar', { method: 'PATCH', body: JSON.stringify(avatar) });
}

export function updateDisplayName(
  displayName: UpdateDisplayNameBody['displayName'],
): Promise<MeUser> {
  return authsRequest('/me/display-name', {
    method: 'PATCH',
    body: JSON.stringify({ displayName }),
  });
}

export function updatePreferences(
  category: PreferenceCategoryId,
  changes: UpdatePreferencesBody,
): Promise<MeUser> {
  return authsRequest(`/me/preferences/${category}`, {
    method: 'PATCH',
    body: JSON.stringify(changes),
  });
}

export function logout(): Promise<void> {
  return authsRequest('/sign-out', { method: 'POST' });
}

function authsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    baseUrl: apiBase,
    parseError: parseAuthsError,
  });
}

// Prefers the service's field messages over the bare status text.
async function parseAuthsError(response: Response): Promise<Error> {
  try {
    const body = (await response.json()) as { error?: string; details?: { message: string }[] };
    const message = body.details?.map((detail) => detail.message).join('. ') || body.error;
    if (message) {
      return new UserFacingError(message);
    }
  } catch {
    // non-JSON error body
  }
  console.error(
    `Auths request failed: ${response.status} ${response.statusText || '(no status text)'}`,
  );
  return new UserFacingError(DEFAULT_ERROR_MESSAGE);
}
