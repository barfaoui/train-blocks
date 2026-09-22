import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signToken } from '@common/utils/jwt.util';

import {
  deleteAccount,
  getMe,
  isUsernameAvailable,
  signIn,
  signUp,
  updateAvatar,
  updateDisplayName,
  updatePreferences,
} from './service';
import { prisma } from '../data/prisma';
import {
  InvalidCredentialsError,
  InvalidPreferencesError,
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
    userPreferences: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
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

const prismaPreferences = prisma.userPreferences as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
};

const prismaTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const prismaExecuteRaw = prisma.$executeRaw as unknown as ReturnType<typeof vi.fn>;

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

    expect(prismaUser.findUnique).toHaveBeenCalledWith({
      where: { username: 'bochra', deletedAt: null },
    });
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
      where: { id: 'user-1', deletedAt: null },
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

describe('updateDisplayName', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves the name and returns the refreshed profile', async () => {
    prismaUser.update.mockResolvedValue({});
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      email: null,
      emailVerifiedAt: null,
      displayName: 'Bochra A.',
      avatarIcon: null,
      avatarColor: null,
      createdAt: new Date('2026-08-15T07:00:00.000Z'),
      preferences: null,
    });

    const me = await updateDisplayName('user-1', 'Bochra A.');

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { displayName: 'Bochra A.' },
    });
    expect(me.displayName).toBe('Bochra A.');
  });

  it('clears the name with null', async () => {
    prismaUser.update.mockResolvedValue({});
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      email: null,
      emailVerifiedAt: null,
      displayName: null,
      avatarIcon: null,
      avatarColor: null,
      createdAt: new Date('2026-08-15T07:00:00.000Z'),
      preferences: null,
    });

    await updateDisplayName('user-1', null);

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { displayName: null },
    });
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaUser.update.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );

    await expect(updateDisplayName('user-1', 'Bochra')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('updatePreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaPreferences.upsert.mockResolvedValue({});
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      email: null,
      emailVerifiedAt: null,
      displayName: null,
      avatarIcon: null,
      avatarColor: null,
      createdAt: new Date('2026-08-15T07:00:00.000Z'),
      preferences: { weekStart: 'SUNDAY' },
    });
  });

  it('upserts the changes and returns the refreshed profile', async () => {
    const me = await updatePreferences('user-1', { weekStart: 'SUNDAY' });

    expect(prismaPreferences.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      create: { userId: 'user-1', weekStart: 'SUNDAY' },
      update: { weekStart: 'SUNDAY' },
    });
    expect(me.preferences).toMatchObject({ weekStart: 'SUNDAY' });
  });

  it('does not read the stored preferences when the active day is untouched', async () => {
    await updatePreferences('user-1', { timeFormat: 'H12' });

    expect(prismaPreferences.findUnique).not.toHaveBeenCalled();
  });

  it('rejects an active day that ends before the stored start', async () => {
    prismaPreferences.findUnique.mockResolvedValue({ workDayStart: 10, workDayEnd: 20 });

    await expect(updatePreferences('user-1', { workDayEnd: 9 })).rejects.toBeInstanceOf(
      InvalidPreferencesError,
    );
    expect(prismaPreferences.upsert).not.toHaveBeenCalled();
  });

  it('checks against the defaults when there is no stored row yet', async () => {
    prismaPreferences.findUnique.mockResolvedValue(null);

    await expect(updatePreferences('user-1', { workDayStart: 21 })).rejects.toBeInstanceOf(
      InvalidPreferencesError,
    );
  });

  it('accepts a start and end that agree with each other', async () => {
    prismaPreferences.findUnique.mockResolvedValue({ workDayStart: 8, workDayEnd: 20 });

    await expect(
      updatePreferences('user-1', { workDayStart: 6, workDayEnd: 22 }),
    ).resolves.toBeDefined();
  });

  it('refuses email notifications for an account without an email', async () => {
    prismaUser.findUnique.mockResolvedValue({ email: null });

    await expect(updatePreferences('user-1', { notifyByEmail: true })).rejects.toBeInstanceOf(
      InvalidPreferencesError,
    );
    expect(prismaPreferences.upsert).not.toHaveBeenCalled();
  });

  it('allows email notifications once an email is set', async () => {
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      email: 'bochra@example.com',
      emailVerifiedAt: null,
      displayName: null,
      avatarIcon: null,
      avatarColor: null,
      createdAt: new Date('2026-08-15T07:00:00.000Z'),
      preferences: { notifyByEmail: true },
    });

    await expect(updatePreferences('user-1', { notifyByEmail: true })).resolves.toBeDefined();
    expect(prismaPreferences.upsert).toHaveBeenCalled();
  });

  it('lets a user without an email turn email notifications off', async () => {
    // The default mock is an account without an email.
    await updatePreferences('user-1', { notifyByEmail: false });

    expect(prismaPreferences.upsert).toHaveBeenCalled();
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaPreferences.upsert.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: 'test',
      }),
    );

    await expect(updatePreferences('user-1', { theme: 'DARK' })).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe('deleteAccount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('soft-deletes the account and its sole-participant events in one transaction', async () => {
    prismaUser.findUnique.mockResolvedValue({ deletedAt: null });
    prismaUser.update.mockResolvedValue({});
    prismaExecuteRaw.mockResolvedValue(0);
    prismaTransaction.mockResolvedValue(undefined);

    await deleteAccount('user-1');

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { deletedAt: expect.any(Date) },
    });
    // The raw query is a tagged template: its values (here just the user id, used
    // twice) come after the SQL fragments.
    expect(prismaExecuteRaw).toHaveBeenCalledWith(expect.anything(), 'user-1', 'user-1');
    expect(prismaTransaction).toHaveBeenCalledTimes(1);
    expect(prismaTransaction.mock.calls[0][0]).toHaveLength(2);
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(deleteAccount('user-1')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(prismaUser.update).not.toHaveBeenCalled();
  });

  it('throws UnauthorizedError when the account is already deleted', async () => {
    prismaUser.findUnique.mockResolvedValue({ deletedAt: new Date() });

    await expect(deleteAccount('user-1')).rejects.toBeInstanceOf(UnauthorizedError);
    expect(prismaUser.update).not.toHaveBeenCalled();
  });
});
