import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signToken } from '@common/utils/jwt.util';

import { getMe, isUsernameAvailable, signIn, signUp, updateAvatar } from './service';
import { prisma } from '../data/prisma';
import {
  InvalidCredentialsError,
  UnauthorizedError,
  UsernameTakenError,
} from '../data/types/errors';
import { hashPassword, verifyPassword } from '../utils/password.util';

vi.mock('../data/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock('../utils/password.util', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('@common/utils/jwt.util', () => ({
  signToken: vi.fn(),
}));

const prismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};

const hashPasswordMock = vi.mocked(hashPassword);
const verifyPasswordMock = vi.mocked(verifyPassword);
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
      data: {
        username: 'bochra',
        passwordHash: 'hashed-password',
        preferences: { create: {} },
      },
    });
    expect(signTokenMock).toHaveBeenCalledWith({ sub: 'user-1', username: 'bochra' });
  });

  it('creates the starting preferences from the browser hints', async () => {
    prismaUser.create.mockResolvedValue({ id: 'user-1', username: 'bochra' });

    await signUp('bochra', 'Secret1!', { locale: 'fr-FR', timezone: 'Europe/Paris' });

    expect(prismaUser.create).toHaveBeenCalledWith({
      data: {
        username: 'bochra',
        passwordHash: 'hashed-password',
        preferences: {
          create: {
            locale: 'fr-FR',
            timezone: 'Europe/Paris',
            timeFormat: 'H24',
            weekStart: 'MONDAY',
          },
        },
      },
    });
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

describe('signIn', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    signTokenMock.mockReturnValue('signed-token');
  });

  it('returns a token when credentials match', async () => {
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      passwordHash: 'hashed-password',
    });
    verifyPasswordMock.mockResolvedValue(true);

    await expect(signIn('bochra', 'Secret1!')).resolves.toEqual({
      token: 'signed-token',
      user: { id: 'user-1', username: 'bochra' },
    });

    expect(prismaUser.findUnique).toHaveBeenCalledWith({ where: { username: 'bochra' } });
    expect(verifyPasswordMock).toHaveBeenCalledWith('Secret1!', 'hashed-password');
    expect(signTokenMock).toHaveBeenCalledWith({ sub: 'user-1', username: 'bochra' });
  });

  it('throws InvalidCredentialsError when the password is wrong', async () => {
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      passwordHash: 'hashed-password',
    });
    verifyPasswordMock.mockResolvedValue(false);

    await expect(signIn('bochra', 'Wrong1!')).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(verifyPasswordMock).toHaveBeenCalledWith('Wrong1!', 'hashed-password');
    expect(signTokenMock).not.toHaveBeenCalled();
  });

  it('throws InvalidCredentialsError for an unknown user without comparing a password', async () => {
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(signIn('bochra', 'Secret1!')).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(verifyPasswordMock).not.toHaveBeenCalled();
    expect(signTokenMock).not.toHaveBeenCalled();
  });
});

describe('getMe', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns the user profile without the password hash', async () => {
    const createdAt = new Date('2026-08-15T07:00:00.000Z');
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      email: null,
      emailVerifiedAt: null,
      displayName: 'Bochra',
      avatarIcon: 'star',
      avatarColor: '#7C3AED',
      createdAt,
      preferences: null,
    });

    await expect(getMe('user-1')).resolves.toEqual({
      id: 'user-1',
      username: 'bochra',
      email: null,
      emailVerifiedAt: null,
      displayName: 'Bochra',
      avatarIcon: 'star',
      avatarColor: '#7C3AED',
      createdAt: '2026-08-15T07:00:00.000Z',
      preferences: null,
    });

    expect(prismaUser.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      omit: { passwordHash: true },
      include: { preferences: { omit: { userId: true } } },
    });
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(getMe('user-1')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('updateAvatar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves the avatar and returns the refreshed profile', async () => {
    prismaUser.update.mockResolvedValue({});
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      email: null,
      emailVerifiedAt: null,
      displayName: null,
      avatarIcon: '🏃',
      avatarColor: '#7C3AED',
      createdAt: new Date('2026-08-15T07:00:00.000Z'),
      preferences: null,
    });

    const me = await updateAvatar('user-1', { avatarIcon: '🏃', avatarColor: '#7C3AED' });

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { avatarIcon: '🏃', avatarColor: '#7C3AED' },
    });
    expect(me).toMatchObject({ avatarIcon: '🏃', avatarColor: '#7C3AED' });
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaUser.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );

    await expect(
      updateAvatar('user-1', { avatarIcon: '🏃', avatarColor: '#7C3AED' }),
    ).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
