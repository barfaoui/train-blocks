import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signToken } from '@common/utils/jwt.util';

import { UsernameTakenError, isUsernameAvailable, signUp } from './service';
import { prisma } from '../data/prisma';
import { hashPassword } from '../utils/password.util';

vi.mock('../data/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock('../utils/password.util', () => ({
  hashPassword: vi.fn(),
}));

vi.mock('@common/utils/jwt.util', () => ({
  signToken: vi.fn(),
}));

const prismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
};

const hashPasswordMock = vi.mocked(hashPassword);
const signTokenMock = vi.mocked(signToken);

describe('isUsernameAvailable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns true when no user exists', async () => {
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(isUsernameAvailable('bochra')).resolves.toBe(true);
    expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { username: 'bochra' } });
  });

  it('returns false when the username is taken', async () => {
    prismaUser.findUnique.mockResolvedValue({ id: 'user-1', username: 'bochra' });

    await expect(isUsernameAvailable('bochra')).resolves.toBe(false);
  });
});

describe('signUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hashPasswordMock.mockResolvedValue('hashed-password');
    signTokenMock.mockReturnValue('signed-token');
  });

  it('hashes the password, creates the user, and returns a token', async () => {
    prismaUser.create.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      passwordHash: 'hashed-password',
    });

    await expect(signUp('bochra', 'Secret1!')).resolves.toEqual({
      token: 'signed-token',
      user: { id: 'user-1', username: 'bochra' },
    });

    expect(hashPasswordMock).toHaveBeenCalledWith('Secret1!');
    expect(prismaUser.create).toHaveBeenCalledWith({
      data: { username: 'bochra', passwordHash: 'hashed-password' },
    });
    expect(signTokenMock).toHaveBeenCalledWith({ sub: 'user-1', username: 'bochra' });
  });

  it('throws UsernameTakenError on unique constraint failure', async () => {
    prismaUser.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
        code: 'P2002',
        clientVersion: '5.22.0',
        meta: { target: ['username'] },
      }),
    );

    await expect(signUp('bochra', 'Secret1!')).rejects.toBeInstanceOf(UsernameTakenError);
    expect(signTokenMock).not.toHaveBeenCalled();
  });
});
