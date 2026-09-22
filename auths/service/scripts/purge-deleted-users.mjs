import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const RETENTION_DAYS = 7;
const prisma = new PrismaClient();

const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
// Deleting the user cascades to its preferences row (onDelete: Cascade).
const { count } = await prisma.user.deleteMany({
  where: { deletedAt: { lt: cutoff } },
});

console.log(
  `[purge-deleted-users] removed ${count} user(s) soft-deleted before ${cutoff.toISOString()}`,
);
await prisma.$disconnect();
