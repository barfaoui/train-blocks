import { ACCESS_TOKEN_STORAGE_KEY } from '@common/auth-constants';

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function isAuthenticated(): boolean {
  return getAccessToken() !== null;
}
