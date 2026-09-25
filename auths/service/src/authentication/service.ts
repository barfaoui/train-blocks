import { Prisma } from '@prisma/client';

import { DEFAULT_USER_PREFERENCES, type UpdatePreferencesBody } from '@common/auth-types';
import { signToken } from '@common/utils/jwt.util';

import { prisma } from '../data/prisma';
import { verificationEmail, verificationLink } from './emails/verification-email';
import type { AuthResult, MeUser, UpdateAvatarBody } from '../data/types/authentication';
import {
  EmailAlreadyVerifiedError,
  EmailNotSetError,
  InvalidCredentialsError,
  InvalidPreferencesError,
  InvalidVerificationTokenError,
  UnauthorizedError,
  UsernameTakenError,
  VerificationCooldownError,
} from '../data/types/errors';
import {
  EMAIL_VERIFICATION_TTL_MS,
  SEND_COOLDOWN_MS,
  generateLinkToken,
  hashLinkToken,
} from '../utils/link-token.util';
import { sendMail } from '../utils/mail.util';
import { hashPassword, verifyPassword } from '../utils/password.util';
import { type BrowserHints, initialPreferencesFor } from '../utils/preferences.util';

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { username } });
  return existing === null;
}

export async function signUp(
  username: string,
  password: string,
  hints: BrowserHints = {},
): Promise<AuthResult> {
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: {
        username,
        passwordHash,
        preferences: { create: initialPreferencesFor(hints) },
      },
    });

    const token = signToken({ sub: user.id, username: user.username });

    return {
      token,
      user: { id: user.id, username: user.username },
    };
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      throw new UsernameTakenError();
    }
    throw error;
  }
}

export async function signIn(username: string, password: string): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { username, deletedAt: null } });
  if (!user) {
    throw new InvalidCredentialsError();
  }

  const matches = await verifyPassword(password, user.passwordHash);
  if (!matches) {
    throw new InvalidCredentialsError();
  }

  const token = signToken({ sub: user.id, username: user.username });

  return {
    token,
    user: { id: user.id, username: user.username },
  };
}

export async function getMe(userId: string): Promise<MeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    omit: { passwordHash: true },
    include: { preferences: { omit: { userId: true } } },
  });

  if (!user) {
    throw new UnauthorizedError();
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
    displayName: user.displayName,
    avatarIcon: user.avatarIcon,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt.toISOString(),
    preferences: user.preferences,
  };
}

// A soft-deleted (but not yet purged) account can't be reached through any authenticated
// route: `requireAuth` itself now rejects it before a handler runs. This is only for
// `deleteAccount`, to make a repeat or racing delete a clean no-op instead of a second write.
async function assertAccountIsActive(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { deletedAt: true } });
  if (!user || user.deletedAt) {
    throw new UnauthorizedError();
  }
}

async function updateProfileFields(
  userId: string,
  data: Pick<Prisma.UserUpdateInput, 'avatarIcon' | 'avatarColor' | 'displayName'>,
): Promise<MeUser> {
  try {
    await prisma.user.update({ where: { id: userId }, data });
  } catch (error) {
    // P2025: the user no longer exists.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new UnauthorizedError();
    }
    throw error;
  }

  return getMe(userId);
}

export function updateAvatar(userId: string, avatar: UpdateAvatarBody): Promise<MeUser> {
  return updateProfileFields(userId, avatar);
}

export function updateDisplayName(userId: string, displayName: string | null): Promise<MeUser> {
  return updateProfileFields(userId, { displayName });
}

// The active day's start and end also have to agree with each other and with the stored values.
async function assertActiveDayIsValid(userId: string, changes: UpdatePreferencesBody) {
  if (changes.workDayStart === undefined && changes.workDayEnd === undefined) {
    return;
  }

  const stored = await prisma.userPreferences.findUnique({ where: { userId } });
  const start =
    changes.workDayStart ?? stored?.workDayStart ?? DEFAULT_USER_PREFERENCES.workDayStart;
  const end = changes.workDayEnd ?? stored?.workDayEnd ?? DEFAULT_USER_PREFERENCES.workDayEnd;
  if (end <= start) {
    throw new InvalidPreferencesError([
      { path: 'workDayEnd', message: 'The active day must end after it starts' },
    ]);
  }
}

// Email notifications only go to an address the user has proven they own. Changing or
// removing the email turns them back off, so this also holds for stored preferences.
async function assertEmailIsVerified(userId: string, changes: UpdatePreferencesBody) {
  if (changes.notifyByEmail !== true) {
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerifiedAt: true },
  });
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!user.email || !user.emailVerifiedAt) {
    throw new InvalidPreferencesError([
      {
        path: 'notifyByEmail',
        message: user.email
          ? 'Verify your email address to turn on email notifications'
          : 'Add an email address to turn on email notifications',
      },
    ]);
  }
}

// Also creates the preferences row for accounts that predate it.
export async function updatePreferences(
  userId: string,
  changes: UpdatePreferencesBody,
): Promise<MeUser> {
  await assertActiveDayIsValid(userId, changes);
  await assertEmailIsVerified(userId, changes);

  try {
    await prisma.userPreferences.upsert({
      where: { userId },
      create: { userId, ...changes },
      update: changes,
    });
  } catch (error) {
    // P2003: no user with this id, so the row has nothing to belong to.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
      throw new UnauthorizedError();
    }
    throw error;
  }

  return getMe(userId);
}

// Soft delete: the row (and its preferences, via cascade) is purged some days later by
// auths/service/scripts/purge-deleted-users.mjs. The username stays reserved until then.
//
// Also soft-deletes the events this user created, but only the ones nobody else is on: an
// event with another participant survives, since it isn't solely theirs to remove. The
// planner and auths schemas live in the same database, so this runs as one transaction with
// the user update; the events then age out on the planner's own purge schedule
// (planner/service/scripts/purge-deleted-events.mjs), same as any other deleted event.
export async function deleteAccount(userId: string): Promise<void> {
  await assertAccountIsActive(userId);

  await prisma.$transaction([
    prisma.user.update({ where: { id: userId }, data: { deletedAt: new Date() } }),
    prisma.$executeRaw`
      UPDATE "planner"."events"
      SET "deleted_at" = now()
      WHERE "created_by_id" = ${userId}::uuid
        AND "deleted_at" IS NULL
        AND NOT EXISTS (
          SELECT 1 FROM "planner"."event_participants"
          WHERE "event_participants"."event_id" = "events"."id"
            AND "event_participants"."user_id" <> ${userId}::uuid
        )
    `,
  ]);
}

type VerificationRecipient = { username: string; displayName: string | null };

// The writes that start a new verification: the previous links stop working and a new
// one is stored. Returned as queries so callers can run them in their own transaction.
function replaceVerificationToken(userId: string, email: string) {
  const { token, tokenHash } = generateLinkToken();
  const queries = [
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: {
        userId,
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
      },
    }),
  ];
  return { token, queries };
}

// Sent after the token is committed: if the mail fails, the address stays saved and the
// user can ask for another email instead of retyping it.
function sendVerificationEmail(email: string, token: string, recipient: VerificationRecipient) {
  return sendMail(
    verificationEmail(email, recipient.displayName ?? recipient.username, verificationLink(token)),
  );
}

async function findEmailOwner(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId, deletedAt: null },
    select: {
      username: true,
      displayName: true,
      email: true,
      emailVerifiedAt: true,
      emailVerificationTokens: {
        select: { createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });
  if (!user) {
    throw new UnauthorizedError();
  }
  return user;
}

type EmailOwner = Awaited<ReturnType<typeof findEmailOwner>>;

// Applies to every verification email, whichever route sends it: otherwise switching
// between addresses would send unlimited mail to arbitrary recipients from our sender.
function assertVerificationCooldownElapsed(user: EmailOwner): void {
  const lastSentAt = user.emailVerificationTokens[0]?.createdAt;
  if (lastSentAt && Date.now() - lastSentAt.getTime() < SEND_COOLDOWN_MS) {
    throw new VerificationCooldownError();
  }
}

async function resendFor(userId: string, user: EmailOwner): Promise<void> {
  if (!user.email) {
    throw new EmailNotSetError();
  }
  if (user.emailVerifiedAt) {
    throw new EmailAlreadyVerifiedError();
  }
  assertVerificationCooldownElapsed(user);

  const { token, queries } = replaceVerificationToken(userId, user.email);
  await prisma.$transaction(queries);
  await sendVerificationEmail(user.email, token, user);
}

// Replaces the address right away; it shows as unverified until the emailed link is used.
// `email` is expected lowercased (see `setEmailBody`).
export async function setEmail(userId: string, email: string): Promise<MeUser> {
  const user = await findEmailOwner(userId);

  if (user.email === email) {
    // Re-submitting the current address: nothing to do once verified, otherwise it's a
    // request for a fresh link (subject to the same cooldown as an explicit resend).
    if (!user.emailVerifiedAt) {
      await resendFor(userId, user);
    }
    return getMe(userId);
  }
  assertVerificationCooldownElapsed(user);

  const { token, queries } = replaceVerificationToken(userId, email);
  try {
    await prisma.$transaction([
      prisma.user.update({ where: { id: userId }, data: { email, emailVerifiedAt: null } }),
      prisma.userPreferences.updateMany({ where: { userId }, data: { notifyByEmail: false } }),
      // A reset link sent to the previous address must not outlive it.
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
      ...queries,
    ]);
  } catch (error) {
    // P2025: the user no longer exists.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new UnauthorizedError();
    }
    throw error;
  }

  await sendVerificationEmail(email, token, user);
  return getMe(userId);
}

export async function resendVerificationEmail(userId: string): Promise<void> {
  await resendFor(userId, await findEmailOwner(userId));
}

// Needs no session: the link may be opened on a device where the user isn't signed in,
// and the 256-bit token is itself the proof.
export async function verifyEmail(token: string): Promise<void> {
  const record = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash: hashLinkToken(token) },
    include: { user: { select: { email: true, deletedAt: true } } },
  });
  if (
    !record ||
    record.expiresAt.getTime() <= Date.now() ||
    record.user.deletedAt ||
    record.user.email !== record.email
  ) {
    throw new InvalidVerificationTokenError();
  }

  // The email condition guards against the address changing between the read above and
  // this write, so a stale link can never mark a different address as verified.
  const [verified] = await prisma.$transaction([
    prisma.user.updateMany({
      where: { id: record.userId, email: record.email, deletedAt: null },
      data: { emailVerifiedAt: new Date() },
    }),
    prisma.emailVerificationToken.deleteMany({
      where: { userId: record.userId, email: record.email },
    }),
  ]);
  if (verified.count === 0) {
    throw new InvalidVerificationTokenError();
  }
}

// Pending verification links are kept on purpose: they can't verify anything once the
// address is gone (`verifyEmail` checks it still matches), and the latest one keeps the
// send cooldown running, so removing and re-adding an address can't be used to skip it.
// They're deleted when they expire by auths/service/scripts/purge-expired-email-tokens.mjs.
export async function removeEmail(userId: string): Promise<MeUser> {
  try {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { email: null, emailVerifiedAt: null },
      }),
      prisma.userPreferences.updateMany({ where: { userId }, data: { notifyByEmail: false } }),
      // Unlike verification links, reset links go: they would still open the account.
      prisma.passwordResetToken.deleteMany({ where: { userId } }),
    ]);
  } catch (error) {
    // P2025: the user no longer exists.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      throw new UnauthorizedError();
    }
    throw error;
  }

  return getMe(userId);
}

function isUniqueConstraintError(error: unknown): boolean {
  // P2002 is Prisma's code for a unique constraint violation (duplicate username).
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
