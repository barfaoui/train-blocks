import { Prisma } from '@prisma/client';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signToken } from '@common/utils/jwt.util';

import {
  deleteAccount,
  getMe,
  isUsernameAvailable,
  removeEmail,
  resendVerificationEmail,
  setEmail,
  signIn,
  signUp,
  updateAvatar,
  updateDisplayName,
  updatePreferences,
  verifyEmail,
} from './service';
import { prisma } from '../data/prisma';
import {
  EmailAlreadyVerifiedError,
  EmailDeliveryError,
  EmailNotSetError,
  InvalidCredentialsError,
  InvalidPreferencesError,
  InvalidVerificationTokenError,
  UnauthorizedError,
  UsernameTakenError,
  VerificationCooldownError,
} from '../data/types/errors';
import { hashLinkToken } from '../utils/link-token.util';
import { sendMail } from '../utils/mail.util';
import { hashPassword, verifyPassword } from '../utils/password.util';

vi.mock('../data/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    userPreferences: {
      findUnique: vi.fn(),
      upsert: vi.fn(),
      updateMany: vi.fn(),
    },
    emailVerificationToken: {
      findUnique: vi.fn(),
      create: vi.fn(),
      deleteMany: vi.fn(),
    },
    passwordResetToken: {
      deleteMany: vi.fn(),
    },
    $transaction: vi.fn(),
    $executeRaw: vi.fn(),
  },
}));

vi.mock('../utils/password.util', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('../utils/mail.util', () => ({
  sendMail: vi.fn(),
}));

vi.mock('@common/utils/jwt.util', () => ({
  signToken: vi.fn(),
}));

const prismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
};

const prismaPreferences = prisma.userPreferences as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  upsert: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
};

const prismaTokens = prisma.emailVerificationToken as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
};

const prismaResetTokens = prisma.passwordResetToken as unknown as {
  deleteMany: ReturnType<typeof vi.fn>;
};

const prismaTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const prismaExecuteRaw = prisma.$executeRaw as unknown as ReturnType<typeof vi.fn>;

const hashPasswordMock = vi.mocked(hashPassword);
const verifyPasswordMock = vi.mocked(verifyPassword);
const signTokenMock = vi.mocked(signToken);
const sendMailMock = vi.mocked(sendMail);

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
    prismaUser.findUnique.mockResolvedValue({ email: null, emailVerifiedAt: null });

    await expect(updatePreferences('user-1', { notifyByEmail: true })).rejects.toBeInstanceOf(
      InvalidPreferencesError,
    );
    expect(prismaPreferences.upsert).not.toHaveBeenCalled();
  });

  it('refuses email notifications while the email is not verified', async () => {
    prismaUser.findUnique.mockResolvedValue({ email: 'bochra@example.com', emailVerifiedAt: null });

    await expect(updatePreferences('user-1', { notifyByEmail: true })).rejects.toMatchObject({
      details: [{ path: 'notifyByEmail', message: expect.stringContaining('Verify') }],
    });
    expect(prismaPreferences.upsert).not.toHaveBeenCalled();
  });

  it('allows email notifications once the email is verified', async () => {
    prismaUser.findUnique.mockResolvedValue({
      id: 'user-1',
      username: 'bochra',
      email: 'bochra@example.com',
      emailVerifiedAt: new Date('2026-09-01T07:00:00.000Z'),
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

const storedUser = {
  id: 'user-1',
  username: 'bochra',
  email: null as string | null,
  emailVerifiedAt: null as Date | null,
  displayName: null,
  avatarIcon: null,
  avatarColor: null,
  createdAt: new Date('2026-08-15T07:00:00.000Z'),
  preferences: null,
  emailVerificationTokens: [] as { createdAt: Date }[],
};

describe('setEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTransaction.mockResolvedValue([]);
    sendMailMock.mockResolvedValue(undefined);
  });

  it('does nothing when the address is already the verified one', async () => {
    prismaUser.findUnique.mockResolvedValue({
      ...storedUser,
      email: 'bochra@example.com',
      emailVerifiedAt: new Date('2026-09-01T07:00:00.000Z'),
    });

    await setEmail('user-1', 'bochra@example.com');

    expect(prismaTransaction).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('replaces the address, resets verification and notifications, and mails a link', async () => {
    prismaUser.findUnique.mockResolvedValue({
      ...storedUser,
      email: 'old@example.com',
      emailVerifiedAt: new Date('2026-09-01T07:00:00.000Z'),
    });

    await setEmail('user-1', 'new@example.com');

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { email: 'new@example.com', emailVerifiedAt: null },
    });
    expect(prismaPreferences.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { notifyByEmail: false },
    });
    expect(prismaTokens.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    // A reset link mailed to the old address must stop working.
    expect(prismaResetTokens.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    const stored = prismaTokens.create.mock.calls[0][0].data;
    expect(stored.email).toBe('new@example.com');

    // The mailed token is the one whose hash was stored, and never the hash itself.
    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.to).toBe('new@example.com');
    const link = new URL(mail.text.match(/https?:\/\/\S+/)![0]);
    expect(hashLinkToken(link.searchParams.get('token')!)).toBe(stored.tokenHash);
    expect(mail.text).not.toContain(stored.tokenHash);
  });

  it('refuses to switch to another address within a minute of the last email', async () => {
    prismaUser.findUnique.mockResolvedValue({
      ...storedUser,
      email: 'first@example.com',
      emailVerificationTokens: [{ createdAt: new Date(Date.now() - 30_000) }],
    });

    await expect(setEmail('user-1', 'second@example.com')).rejects.toBeInstanceOf(
      VerificationCooldownError,
    );
    expect(prismaTransaction).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('keeps the new address when the email cannot be sent', async () => {
    prismaUser.findUnique.mockResolvedValue(storedUser);
    sendMailMock.mockRejectedValue(new EmailDeliveryError());

    await expect(setEmail('user-1', 'new@example.com')).rejects.toBeInstanceOf(EmailDeliveryError);
    expect(prismaTransaction).toHaveBeenCalled();
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(setEmail('user-1', 'new@example.com')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});

describe('resendVerificationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTransaction.mockResolvedValue([]);
    sendMailMock.mockResolvedValue(undefined);
  });

  it('refuses when there is no email', async () => {
    prismaUser.findUnique.mockResolvedValue(storedUser);

    await expect(resendVerificationEmail('user-1')).rejects.toBeInstanceOf(EmailNotSetError);
  });

  it('refuses when the email is already verified', async () => {
    prismaUser.findUnique.mockResolvedValue({
      ...storedUser,
      email: 'bochra@example.com',
      emailVerifiedAt: new Date(),
    });

    await expect(resendVerificationEmail('user-1')).rejects.toBeInstanceOf(
      EmailAlreadyVerifiedError,
    );
  });

  it('refuses a resend within a minute of the last email', async () => {
    prismaUser.findUnique.mockResolvedValue({
      ...storedUser,
      email: 'bochra@example.com',
      emailVerificationTokens: [{ createdAt: new Date(Date.now() - 30_000) }],
    });

    await expect(resendVerificationEmail('user-1')).rejects.toBeInstanceOf(
      VerificationCooldownError,
    );
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('replaces the link once the cooldown has passed', async () => {
    prismaUser.findUnique.mockResolvedValue({
      ...storedUser,
      email: 'bochra@example.com',
      emailVerificationTokens: [{ createdAt: new Date(Date.now() - 120_000) }],
    });

    await resendVerificationEmail('user-1');

    expect(prismaTokens.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'bochra@example.com' }),
    );
  });
});

describe('verifyEmail', () => {
  const token = 'a'.repeat(43);
  const record = {
    id: 'token-1',
    userId: 'user-1',
    email: 'bochra@example.com',
    tokenHash: hashLinkToken(token),
    expiresAt: new Date(Date.now() + 60_000),
    user: { email: 'bochra@example.com', deletedAt: null as Date | null },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    prismaTransaction.mockResolvedValue([{ count: 1 }, { count: 1 }]);
  });

  it('looks the token up by its hash and marks that address verified', async () => {
    prismaTokens.findUnique.mockResolvedValue(record);

    await verifyEmail(token);

    expect(prismaTokens.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: record.tokenHash } }),
    );
    expect(prismaUser.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', email: 'bochra@example.com', deletedAt: null },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it.each([
    ['an unknown token', null],
    ['an expired token', { ...record, expiresAt: new Date(Date.now() - 1) }],
    ['a deleted account', { ...record, user: { ...record.user, deletedAt: new Date() } }],
    [
      'a link sent to an address the user has since replaced',
      { ...record, user: { ...record.user, email: 'other@example.com' } },
    ],
  ])('rejects %s', async (_label, found) => {
    prismaTokens.findUnique.mockResolvedValue(found);

    await expect(verifyEmail(token)).rejects.toBeInstanceOf(InvalidVerificationTokenError);
    expect(prismaTransaction).not.toHaveBeenCalled();
  });

  it('rejects when the address changed between the lookup and the write', async () => {
    prismaTokens.findUnique.mockResolvedValue(record);
    prismaTransaction.mockResolvedValue([{ count: 0 }, { count: 0 }]);

    await expect(verifyEmail(token)).rejects.toBeInstanceOf(InvalidVerificationTokenError);
  });
});

describe('removeEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaTransaction.mockResolvedValue([]);
    prismaUser.findUnique.mockResolvedValue(storedUser);
  });

  it('clears the address and email notifications but keeps pending links', async () => {
    await removeEmail('user-1');

    expect(prismaUser.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { email: null, emailVerifiedAt: null },
    });
    expect(prismaPreferences.updateMany).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      data: { notifyByEmail: false },
    });
    // The latest link keeps the send cooldown running across a remove and re-add.
    expect(prismaTokens.deleteMany).not.toHaveBeenCalled();
    // Reset links would still open the account, though.
    expect(prismaResetTokens.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaTransaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Record not found', {
        code: 'P2025',
        clientVersion: 'test',
      }),
    );

    await expect(removeEmail('user-1')).rejects.toBeInstanceOf(UnauthorizedError);
  });
});
