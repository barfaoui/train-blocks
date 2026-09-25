import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// Used links are deleted when they're used and replaced ones on resend, so only links
// that were never opened before they expired pile up here: email verification and
// password reset alike.
const now = new Date();
const [verification, reset] = await prisma.$transaction([
  prisma.emailVerificationToken.deleteMany({ where: { expiresAt: { lt: now } } }),
  prisma.passwordResetToken.deleteMany({ where: { expiresAt: { lt: now } } }),
]);

console.log(
  `[purge-expired-email-tokens] removed ${verification.count} verification and ${reset.count} password reset link(s) expired before ${now.toISOString()}`,
);
await prisma.$disconnect();
