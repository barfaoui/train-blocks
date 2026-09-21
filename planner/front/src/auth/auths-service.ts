import { authsApiBaseHref } from '@common/app-urls';
import type { MeUser, UpdateAvatarBody } from '@common/auth-types';
import { request } from '@common/utils/request.util';

import { authsServiceBase } from './url-bases';

const apiBase = authsApiBaseHref(authsServiceBase);

export function getMe(): Promise<MeUser> {
  return authsRequest('/me');
}

export function updateAvatar(avatar: UpdateAvatarBody): Promise<MeUser> {
  return authsRequest('/me/avatar', { method: 'PATCH', body: JSON.stringify(avatar) });
}

export function logout(): Promise<void> {
  return authsRequest('/sign-out', { method: 'POST' });
}

function authsRequest<T>(path: string, init?: RequestInit): Promise<T> {
  return request<T>(path, {
    ...init,
    baseUrl: apiBase,
  });
}
