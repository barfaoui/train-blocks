import {
  authsLoginHref as buildAuthsLoginHref,
  authsMeHref as buildAuthsMeHref,
} from '@common/app-urls';

function sameOrigin(): boolean {
  return import.meta.env.VITE_SAME_ORIGIN === 'true';
}

export function authsLoginHref(): string {
  return buildAuthsLoginHref(sameOrigin());
}

export function authsMeHref(): string {
  return buildAuthsMeHref(sameOrigin());
}
