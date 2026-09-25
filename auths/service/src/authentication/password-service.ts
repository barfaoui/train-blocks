import type { ForgotPasswordResult } from '@common/auth-types';
import { signToken } from '@common/utils/jwt.util';

import {
  passwordChangedEmail,
  passwordResetEmail,
  passwordResetLink,
} from './emails/password-emails';
import { prisma } from '../data/prisma';
import type { AuthResult } from '../data/types/authentication';
import {
  IncorrectPasswordError,
  InvalidResetTokenError,
  UnauthorizedError,
  UnknownUsernameError,
  VerificationCooldownError,
} from '../data/types/errors';
import {
  PASSWORD_RESET_TTL_MS,
  SEND_COOLDOWN_MS,
  generateLinkToken,
  hashLinkToken,
} from '../utils/link-token.util';
import { sendMail } from '../utils/mail.util';
import { hashPassword, verifyPassword } from '../utils/password.util';

type Recipient = { username: string; displayName: string | null; email: string | null };

// Best effort: the password has already changed by the time this runs, so a mail failure
// is logged rather than turned into an error for a change that did succeed.
async function notifyPasswordChanged(user: Recipient): Promise<void> {
  if (!user.email) {
    return;
  }
  try {
    await sendMail(passwordChangedEmail(user.email, user.displayName ?? user.username));
  } catch (error) {
    console.error(error);
  }
}

// Setting `passwordChangedAt` signs out every existing session (see `requireAuth`), and any
// pending reset link stops working too.
function passwordUpdateQueries(userId: string, passwordHash: string) {
  return [
    prisma.user.update({
      where: { id: userId },
      data: { passwordHash, passwordChangedAt: new Date() },
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
  ];
}

// Returns a fresh session for the device that made the change, since the change itself
// invalidates the one it was made with.
export async function changePassword(
  userId: string,
  currentPassword: string,
  newPassword: string,
): Promise<AuthResult> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: { username: true, displayName: true, email: true, passwordHash: true },
  });
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!(await verifyPassword(currentPassword, user.passwordHash))) {
    throw new IncorrectPasswordError();
  }

  await prisma.$transaction(passwordUpdateQueries(userId, await hashPassword(newPassword)));
  await notifyPasswordChanged(user);

  return {
    token: signToken({ sub: userId, username: user.username }),
    user: { id: userId, username: user.username },
  };
}

// `bochra@pm.me` → `b•••@pm.me`: enough for the owner to recognise, without handing the
// address to whoever typed the username.
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  return `${email.slice(0, 1)}•••${email.slice(at)}`;
}

// Tells the caller whether the account can be recovered by email, by design: someone who
// forgot their password needs to know whether to check their inbox or ask for help.
// Usernames are already public (see the availability check), so this reveals little more.
export async function requestPasswordReset(username: string): Promise<ForgotPasswordResult> {
  const user = await prisma.user.findUnique({
    where: { username, deletedAt: null },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true,
      emailVerifiedAt: true,
      passwordResetTokens: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!user) {
    throw new UnknownUsernameError();
  }
  // Only a verified address: an unverified one may be a typo for someone else's, and a
  // reset link is a way into the account.
  if (!user.email || !user.emailVerifiedAt) {
    return { status: 'no-email' };
  }
  const lastSentAt = user.passwordResetTokens[0]?.createdAt;
  if (lastSentAt && Date.now() - lastSentAt.getTime() < SEND_COOLDOWN_MS) {
    throw new VerificationCooldownError();
  }

  const { token, tokenHash } = generateLinkToken();
  await prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId: user.id } }),
    prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MS) },
    }),
  ]);
  await sendMail(
    passwordResetEmail(user.email, user.displayName ?? user.username, passwordResetLink(token)),
  );

  return { status: 'sent', email: maskEmail(user.email) };
}

// Needs no session, like verifying an email: the link is the proof.
export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashLinkToken(token) },
    include: {
      user: { select: { username: true, displayName: true, email: true, deletedAt: true } },
    },
  });
  if (!record || record.expiresAt.getTime() <= Date.now() || record.user.deletedAt) {
    throw new InvalidResetTokenError();
  }

  await prisma.$transaction(passwordUpdateQueries(record.userId, await hashPassword(newPassword)));
  await notifyPasswordChanged(record.user);
}
