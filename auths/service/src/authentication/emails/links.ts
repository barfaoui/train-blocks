import { appBaseHref, localhostOrigin } from '@common/app-urls';

// Where links in emails point. Set in production; locally they default to the dev servers.
export function plannerPublicUrl(): string {
  return process.env.PLANNER_PUBLIC_URL || localhostOrigin('planner-front');
}

export function authsPublicUrl(): string {
  return process.env.AUTHS_PUBLIC_URL || appBaseHref('auths-front', false);
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
