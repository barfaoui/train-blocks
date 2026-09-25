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

// Best effort, and not awaited: the password has already changed by the time this runs, so
// neither a mail failure nor a slow mail server should hold up or fail the response.
function notifyPasswordChanged(user: Recipient): void {
  if (!user.email) {
    return;
  }
  sendMail(passwordChangedEmail(user.email, user.displayName ?? user.username)).catch(
    (error: unknown) => console.error(error),
  );
}

// Setting `passwordChangedAt` signs out every existing session (see `requireAuth`).
function passwordUpdate(userId: string, passwordHash: string) {
  return {
    where: { id: userId },
    data: { passwordHash, passwordChangedAt: new Date() },
  };
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

  const passwordHash = await hashPassword(newPassword);
  // Pending reset links stop working too: the user evidently knows their password.
  await prisma.$transaction([
    prisma.user.update(passwordUpdate(userId, passwordHash)),
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
  ]);
  notifyPasswordChanged(user);

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

  // Hashed before the transaction, so bcrypt's deliberate slowness doesn't hold it open.
  const passwordHash = await hashPassword(newPassword);
  await prisma.$transaction(async (tx) => {
    // Claiming the token first keeps it single-use when the form is submitted twice at
    // once: the second delete waits for the first transaction to commit, then finds nothing.
    const claimed = await tx.passwordResetToken.deleteMany({ where: { id: record.id } });
    if (claimed.count === 0) {
      throw new InvalidResetTokenError();
    }
    await tx.user.update(passwordUpdate(record.userId, passwordHash));
    await tx.passwordResetToken.deleteMany({ where: { userId: record.userId } });
  });
  notifyPasswordChanged(record.user);
}
