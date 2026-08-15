import { localhostOrigin } from '@common/app-urls';

export function authsLoginHref(): string {
  if (import.meta.env.VITE_SAME_ORIGIN === 'true') {
    return '/login';
  }

  return `${localhostOrigin('auths-front')}/login`;
}
