import { type AppId, environment } from './environment';

export function localhostOrigin(appId: AppId): string {
  return `http://localhost:${environment.ports[appId]}`;
}

export function resolveSameOrigin(explicitFlag: string | undefined, isProdBuild: boolean): boolean {
  return explicitFlag ? explicitFlag === 'true' : isProdBuild;
}

export function appBaseHref(appId: AppId, sameOrigin: boolean): string {
  return sameOrigin ? '' : localhostOrigin(appId);
}

export function authsLoginHref(authsFrontBase: string): string {
  return authsFrontBase || '/';
}

export function authsApiBaseHref(authsServiceBase: string): string {
  return `${authsServiceBase}/api/auth`;
}

export function isAllowedAppRedirect(href: string): boolean {
  const normalized = href.replace(/\\/g, '/');
  const relative = normalized.startsWith('/') && !normalized.startsWith('//');

  try {
    const url = relative ? new URL(normalized, 'http://local.invalid') : new URL(normalized);
    const targetsAuthsFront = relative || url.origin === localhostOrigin('auths-front');
    if (targetsAuthsFront && url.pathname === '/') {
      return false;
    }
    if (relative) {
      return true;
    }
    return (
      url.origin === localhostOrigin('auths-front') ||
      url.origin === localhostOrigin('planner-front')
    );
  } catch {
    return false;
  }
}
