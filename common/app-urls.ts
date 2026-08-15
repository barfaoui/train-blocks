import { type AppId, environment } from './environment';

export function localhostOrigin(appId: AppId): string {
  return `http://localhost:${environment.ports[appId]}`;
}

export function authsLoginHref(sameOrigin: boolean): string {
  return sameOrigin ? '/login' : `${localhostOrigin('auths-front')}/login`;
}

export function authsMeHref(sameOrigin: boolean): string {
  return sameOrigin ? '/api/auth/me' : `${localhostOrigin('auths-service')}/api/auth/me`;
}
