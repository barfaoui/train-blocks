import { type AppId, environment } from './environment';

export const AUTHS_FRONT_PATH = '/auth';

export function localhostOrigin(appId: AppId): string {
  return `http://localhost:${environment.ports[appId]}`;
}

export function resolveSameOrigin(explicitFlag: string | undefined, isProdBuild: boolean): boolean {
  return explicitFlag ? explicitFlag === 'true' : isProdBuild;
}

export function appBaseHref(appId: AppId, sameOrigin: boolean): string {
  const origin = sameOrigin ? '' : localhostOrigin(appId);
  return appId === 'auths-front' ? `${origin}${AUTHS_FRONT_PATH}` : origin;
}

export function authsLoginHref(authsFrontBase: string): string {
  return `${authsFrontBase}/`;
}

export function authsApiBaseHref(authsServiceBase: string): string {
  return `${authsServiceBase}/api/auth`;
}

export function isAllowedAppRedirect(href: string): boolean {
  const normalized = href.replace(/\\/g, '/');
  const relative = normalized.startsWith('/') && !normalized.startsWith('//');

  try {
    const url = relative ? new URL(normalized, 'http://local.invalid') : new URL(normalized);
    if (relative) {
      return !isUnderPath(url.pathname, AUTHS_FRONT_PATH);
    }
    return url.origin === localhostOrigin('planner-front');
  } catch {
    return false;
  }
}

function isUnderPath(pathname: string, basePath: string): boolean {
  return pathname === basePath || pathname.startsWith(`${basePath}/`);
}
