import { Prisma } from '@prisma/client';

import { signToken } from '@common/utils/jwt.util';

import { prisma } from '../data/prisma';
import type { AuthResult, MeUser, UpdateAvatarBody } from '../data/types/authentication';
import {
  InvalidCredentialsError,
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
  const user = await prisma.user.findUnique({ where: { username } });
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
    where: { id: userId },
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

export async function updateAvatar(userId: string, avatar: UpdateAvatarBody): Promise<MeUser> {
  try {
    await prisma.user.update({ where: { id: userId }, data: avatar });
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
