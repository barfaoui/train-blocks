import { Prisma } from '@prisma/client';

import { signToken } from '@common/utils/jwt.util';

import { prisma } from '../data/prisma';
import type { AuthResult } from '../data/types/authentication';
import { InvalidCredentialsError, UsernameTakenError } from '../data/types/errors';
import { hashPassword, verifyPassword } from '../utils/password.util';

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { username } });
  return existing === null;
}

export async function signUp(username: string, password: string): Promise<AuthResult> {
  const passwordHash = await hashPassword(password);

  try {
    const user = await prisma.user.create({
      data: { username, passwordHash },
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

function isUniqueConstraintError(error: unknown): boolean {
  // P2002 is Prisma's code for a unique constraint violation (duplicate username).
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
