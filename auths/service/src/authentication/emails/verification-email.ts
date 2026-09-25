import { localhostOrigin } from '@common/app-urls';

import type { MailMessage } from '../../utils/mail.util';

// The link opens a planner page that POSTs the token to auths, rather than verifying on
// the GET itself: mail scanners that pre-open links would otherwise use up the token.
export function verificationLink(token: string): string {
  const base = process.env.PLANNER_PUBLIC_URL || localhostOrigin('planner-front');
  return `${base}/verify-email?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function verificationEmail(to: string, name: string, link: string): MailMessage {
  const subject = 'Verify your email address';
  const text = [
    `Hi ${name},`,
    '',
    'Confirm this email address for your Training Planning account by opening this link:',
    link,
    '',
    "The link expires in 24 hours. If you didn't ask for this, you can ignore this email.",
  ].join('\n');
  const html = `<p>Hi ${escapeHtml(name)},</p>
<p>Confirm this email address for your Training Planning account:</p>
<p><a href="${escapeHtml(link)}">Verify my email address</a></p>
<p>The link expires in 24 hours. If you didn't ask for this, you can ignore this email.</p>`;

  return { to, subject, text, html };
}
