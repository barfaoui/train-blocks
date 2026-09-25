import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

// Used links are deleted on verification and replaced ones on resend, so only links
// that were never opened before they expired pile up here.
const now = new Date();
const { count } = await prisma.emailVerificationToken.deleteMany({
  where: { expiresAt: { lt: now } },
});

console.log(
  `[purge-expired-email-tokens] removed ${count} verification link(s) expired before ${now.toISOString()}`,
);
await prisma.$disconnect();
