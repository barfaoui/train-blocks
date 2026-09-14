import dotenv from 'dotenv';
import { PrismaClient } from '../generated/client/index.js';

dotenv.config();

const RETENTION_DAYS = 14;
const prisma = new PrismaClient();

const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000);
const { count } = await prisma.event.deleteMany({
  where: { deletedAt: { lt: cutoff } },
});

console.log(`[purge-deleted-events] removed ${count} event(s) soft-deleted before ${cutoff.toISOString()}`);
await prisma.$disconnect();
