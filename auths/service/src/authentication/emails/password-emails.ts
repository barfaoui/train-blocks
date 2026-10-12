import { SUPPORT_EMAIL } from '@common/contact';

import { authsPublicUrl, escapeHtml } from './links';
import type { MailMessage } from '../../utils/mail.util';

// Like the verification link, this opens a page (on the sign-in app) that POSTs the token
// along with the new password; the GET alone does nothing.
export function passwordResetLink(token: string): string {
  return `${authsPublicUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

export function passwordResetEmail(to: string, name: string, link: string): MailMessage {
  const subject = 'Reset your password';
  const text = [
    `Hi ${name},`,
    '',
    'Someone asked to reset the password of your Training Planning account. To choose a new one, open this link:',
    link,
    '',
    "The link expires in 1 hour. If you didn't ask for this, you can ignore this email: your password stays the same.",
  ].join('\n');
  const html = `<p>Hi ${escapeHtml(name)},</p>
<p>Someone asked to reset the password of your Training Planning account.</p>
<p><a href="${escapeHtml(link)}">Choose a new password</a></p>
<p>The link expires in 1 hour. If you didn't ask for this, you can ignore this email: your password stays the same.</p>`;

  return { to, subject, text, html };
}

export function passwordChangedEmail(to: string, name: string): MailMessage {
  const signInLink = authsPublicUrl();
  const subject = 'Your password was changed';
  const text = [
    `Hi ${name},`,
    '',
    'The password of your Training Planning account was just changed, and every other device was signed out.',
    '',
    "If this was you, there's nothing else to do.",
    `If it wasn't, reset your password right away with "Forgot password?" on the sign-in page (${signInLink}), and contact ${SUPPORT_EMAIL}.`,
  ].join('\n');
  const html = `<p>Hi ${escapeHtml(name)},</p>
<p>The password of your Training Planning account was just changed, and every other device was signed out.</p>
<p>If this was you, there's nothing else to do.</p>
<p>If it wasn't, reset your password right away with "Forgot password?" on the <a href="${escapeHtml(signInLink)}">sign-in page</a>, and contact <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>`;

  return { to, subject, text, html };
}
