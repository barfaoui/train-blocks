import { Prisma } from '@prisma/client';

import { signToken } from '@common/utils/jwt.util';

import { prisma } from '../data/prisma';
import type { SignUpResult } from '../data/types/authentication';
import { hashPassword } from '../utils/password.util';

export class UsernameTakenError extends Error {
  constructor() {
    super('Username already taken');
    this.name = 'UsernameTakenError';
  }
}

export async function isUsernameAvailable(username: string): Promise<boolean> {
  const existing = await prisma.user.findUnique({ where: { username } });
  return existing === null;
}

export async function signUp(username: string, password: string): Promise<SignUpResult> {
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

function isUniqueConstraintError(error: unknown): boolean {
  // P2002 is Prisma's code for a unique constraint violation (duplicate username).
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}
