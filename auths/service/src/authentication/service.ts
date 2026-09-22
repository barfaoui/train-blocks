import { Prisma } from '@prisma/client';

import { DEFAULT_USER_PREFERENCES, type UpdatePreferencesBody } from '@common/auth-types';
import { signToken } from '@common/utils/jwt.util';

import { prisma } from '../data/prisma';
import type { AuthResult, MeUser, UpdateAvatarBody } from '../data/types/authentication';
import {
  InvalidCredentialsError,
  InvalidPreferencesError,
  UnauthorizedError,
  UsernameTakenError,
} from '../data/types/errors';
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

async function assertEmailIsSet(userId: string, changes: UpdatePreferencesBody) {
  if (changes.notifyByEmail !== true) {
    return;
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
  if (!user) {
    throw new UnauthorizedError();
  }
  if (!user.email) {
    throw new InvalidPreferencesError([
      {
        path: 'notifyByEmail',
        message: 'Add an email address to turn on email notifications',
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
  await assertEmailIsSet(userId, changes);

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

function isUniqueConstraintError(error: unknown): boolean {
  // P2002 is Prisma's code for a unique constraint violation (duplicate username).
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
