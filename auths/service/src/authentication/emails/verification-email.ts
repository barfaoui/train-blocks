import { escapeHtml, plannerPublicUrl } from './links';
import type { MailMessage } from '../../utils/mail.util';

// The link opens a planner page that POSTs the token to auths, rather than verifying on
// the GET itself: mail scanners that pre-open links would otherwise use up the token.
export function verificationLink(token: string): string {
  return `${plannerPublicUrl()}/verify-email?token=${encodeURIComponent(token)}`;
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
