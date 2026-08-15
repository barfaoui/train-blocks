import { type AppId, environment } from './environment';

export function localhostOrigin(appId: AppId): string {
  return `http://localhost:${environment.ports[appId]}`;
}
