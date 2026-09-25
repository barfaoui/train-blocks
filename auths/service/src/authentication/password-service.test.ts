import { beforeEach, describe, expect, it, vi } from 'vitest';

import { signToken } from '@common/utils/jwt.util';

import { changePassword, maskEmail, requestPasswordReset, resetPassword } from './password-service';
import { prisma } from '../data/prisma';
import {
  IncorrectPasswordError,
  InvalidResetTokenError,
  UnauthorizedError,
  UnknownUsernameError,
  VerificationCooldownError,
} from '../data/types/errors';
import { hashLinkToken } from '../utils/link-token.util';
import { sendMail } from '../utils/mail.util';
import { hashPassword, verifyPassword } from '../utils/password.util';

vi.mock('../data/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordResetToken: { findUnique: vi.fn(), create: vi.fn(), deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock('../utils/mail.util', () => ({ sendMail: vi.fn() }));

vi.mock('../utils/password.util', () => ({
  hashPassword: vi.fn(),
  verifyPassword: vi.fn(),
}));

vi.mock('@common/utils/jwt.util', () => ({ signToken: vi.fn() }));

const prismaUser = prisma.user as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
const prismaResetTokens = prisma.passwordResetToken as unknown as {
  findUnique: ReturnType<typeof vi.fn>;
  create: ReturnType<typeof vi.fn>;
  deleteMany: ReturnType<typeof vi.fn>;
};
const prismaTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;
const sendMailMock = vi.mocked(sendMail);
const hashPasswordMock = vi.mocked(hashPassword);
const verifyPasswordMock = vi.mocked(verifyPassword);
const signTokenMock = vi.mocked(signToken);

beforeEach(() => {
  vi.clearAllMocks();
  // Array transactions resolve as is; interactive ones run against the same mocks.
  prismaTransaction.mockImplementation((arg: unknown) =>
    typeof arg === 'function' ? arg(prisma) : Promise.resolve([]),
  );
  prismaResetTokens.deleteMany.mockResolvedValue({ count: 1 });
  sendMailMock.mockResolvedValue(undefined);
  hashPasswordMock.mockResolvedValue('new-hash');
});

function expectPasswordUpdated(userId: string) {
  expect(prismaUser.update).toHaveBeenCalledWith({
    where: { id: userId },
    data: { passwordHash: 'new-hash', passwordChangedAt: expect.any(Date) },
  });
  expect(prismaResetTokens.deleteMany).toHaveBeenCalledWith({ where: { userId } });
}

describe('changePassword', () => {
  const storedUser = {
    username: 'bochra',
    displayName: null,
    email: 'bochra@example.com',
    passwordHash: 'old-hash',
  };

  it('refuses a wrong current password without changing anything', async () => {
    prismaUser.findUnique.mockResolvedValue(storedUser);
    verifyPasswordMock.mockResolvedValue(false);

    await expect(changePassword('user-1', 'wrong', 'NewSecret2@')).rejects.toBeInstanceOf(
      IncorrectPasswordError,
    );
    expect(prismaTransaction).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('stores the new password, signs out other sessions and hands back a new one', async () => {
    prismaUser.findUnique.mockResolvedValue(storedUser);
    verifyPasswordMock.mockResolvedValue(true);
    signTokenMock.mockReturnValue('fresh-token' as never);

    const result = await changePassword('user-1', 'OldSecret1!', 'NewSecret2@');

    expect(hashPasswordMock).toHaveBeenCalledWith('NewSecret2@');
    expectPasswordUpdated('user-1');
    expect(result.token).toBe('fresh-token');
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'bochra@example.com', subject: 'Your password was changed' }),
    );
  });

  it('sends no email when the account has no address', async () => {
    prismaUser.findUnique.mockResolvedValue({ ...storedUser, email: null });
    verifyPasswordMock.mockResolvedValue(true);

    await changePassword('user-1', 'OldSecret1!', 'NewSecret2@');

    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('still succeeds when the notification email fails', async () => {
    prismaUser.findUnique.mockResolvedValue(storedUser);
    verifyPasswordMock.mockResolvedValue(true);
    sendMailMock.mockRejectedValue(new Error('SMTP down'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    await expect(changePassword('user-1', 'OldSecret1!', 'NewSecret2@')).resolves.toBeDefined();
  });

  it('does not wait for the notification email', async () => {
    prismaUser.findUnique.mockResolvedValue(storedUser);
    verifyPasswordMock.mockResolvedValue(true);
    // A mail server that never answers.
    sendMailMock.mockReturnValue(new Promise(() => {}));

    await expect(changePassword('user-1', 'OldSecret1!', 'NewSecret2@')).resolves.toBeDefined();
  });

  it('throws UnauthorizedError when the user no longer exists', async () => {
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(changePassword('user-1', 'OldSecret1!', 'NewSecret2@')).rejects.toBeInstanceOf(
      UnauthorizedError,
    );
  });
});

describe('requestPasswordReset', () => {
  const storedUser = {
    id: 'user-1',
    username: 'bochra',
    displayName: null,
    email: 'bochra@example.com',
    emailVerifiedAt: new Date('2026-09-01T07:00:00.000Z'),
    passwordResetTokens: [] as { createdAt: Date }[],
  };

  it('rejects an unknown username', async () => {
    prismaUser.findUnique.mockResolvedValue(null);

    await expect(requestPasswordReset('nobody')).rejects.toBeInstanceOf(UnknownUsernameError);
  });

  it.each([
    ['no email', { email: null, emailVerifiedAt: null }],
    ['an unverified email', { emailVerifiedAt: null }],
  ])('sends nothing for an account with %s', async (_label, overrides) => {
    prismaUser.findUnique.mockResolvedValue({ ...storedUser, ...overrides });

    await expect(requestPasswordReset('bochra')).resolves.toEqual({ status: 'no-email' });
    expect(prismaTransaction).not.toHaveBeenCalled();
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('refuses a second request within a minute', async () => {
    prismaUser.findUnique.mockResolvedValue({
      ...storedUser,
      passwordResetTokens: [{ createdAt: new Date(Date.now() - 30_000) }],
    });

    await expect(requestPasswordReset('bochra')).rejects.toBeInstanceOf(VerificationCooldownError);
    expect(sendMailMock).not.toHaveBeenCalled();
  });

  it('replaces older links and mails one to the verified address', async () => {
    prismaUser.findUnique.mockResolvedValue(storedUser);

    await expect(requestPasswordReset('bochra')).resolves.toEqual({
      status: 'sent',
      email: 'b•••@example.com',
    });

    expect(prismaResetTokens.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    const stored = prismaResetTokens.create.mock.calls[0][0].data;
    // The mailed token is the one whose hash was stored, on the sign-in app's reset page.
    const mail = sendMailMock.mock.calls[0][0];
    expect(mail.to).toBe('bochra@example.com');
    const link = new URL(mail.text.match(/https?:\/\/\S+/)![0]);
    expect(link.pathname).toBe('/auth/reset-password');
    expect(hashLinkToken(link.searchParams.get('token')!)).toBe(stored.tokenHash);
  });
});

describe('resetPassword', () => {
  const token = 'a'.repeat(43);
  const record = {
    id: 'token-1',
    userId: 'user-1',
    tokenHash: hashLinkToken(token),
    expiresAt: new Date(Date.now() + 60_000),
    user: {
      username: 'bochra',
      displayName: null,
      email: 'bochra@example.com',
      deletedAt: null as Date | null,
    },
  };

  it.each([
    ['an unknown token', null],
    ['an expired token', { ...record, expiresAt: new Date(Date.now() - 1) }],
    ['a deleted account', { ...record, user: { ...record.user, deletedAt: new Date() } }],
  ])('rejects %s', async (_label, found) => {
    prismaResetTokens.findUnique.mockResolvedValue(found);

    await expect(resetPassword(token, 'NewSecret2@')).rejects.toBeInstanceOf(
      InvalidResetTokenError,
    );
    expect(prismaTransaction).not.toHaveBeenCalled();
  });

  it('rejects a token another submission already used', async () => {
    prismaResetTokens.findUnique.mockResolvedValue(record);
    // The concurrent submission committed first and claimed the token.
    prismaResetTokens.deleteMany.mockResolvedValueOnce({ count: 0 });

    await expect(resetPassword(token, 'NewSecret2@')).rejects.toBeInstanceOf(
      InvalidResetTokenError,
    );
    expect(prismaUser.update).not.toHaveBeenCalled();
  });

  it('sets the new password, signs everyone out and says so by email', async () => {
    prismaResetTokens.findUnique.mockResolvedValue(record);

    await resetPassword(token, 'NewSecret2@');

    expect(prismaResetTokens.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { tokenHash: record.tokenHash } }),
    );
    expect(prismaResetTokens.deleteMany).toHaveBeenCalledWith({ where: { id: 'token-1' } });
    expectPasswordUpdated('user-1');
    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'bochra@example.com', subject: 'Your password was changed' }),
    );
  });
});

describe('maskEmail', () => {
  it('keeps the first character and the domain', () => {
    expect(maskEmail('bochra@pm.me')).toBe('b•••@pm.me');
  });
});
