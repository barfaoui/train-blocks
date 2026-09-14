import dotenv from 'dotenv';

import { PrismaClient } from '../../generated/client';

dotenv.config();

export const prisma = new PrismaClient();
