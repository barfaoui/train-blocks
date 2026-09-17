import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEvent } from './service';
import { Prisma } from '../../generated/client';
import { prisma } from '../data/prisma';
import { PlanNotFoundError } from '../data/types/errors';

vi.mock('../data/prisma', () => ({
  prisma: {
    event: {
      createMany: vi.fn(),
    },
  },
}));

const prismaEvent = prisma.event as unknown as {
  createMany: ReturnType<typeof vi.fn>;
};

const baseInput = {
  title: 'Morning Run',
  startDate: '2026-09-15',
  endDate: '2026-09-15',
  startTime: null,
  endTime: null,
  timezone: 'Europe/Paris',
  sportType: 'RUNNING' as const,
  description: null,
  location: null,
  planId: null,
  recurrenceRule: null,
};

describe('createEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaEvent.createMany.mockResolvedValue({ count: 1 });
  });

  it('creates a single non-recurring event with no seriesId', async () => {
    const result = await createEvent('user-1', baseInput);

    expect(prismaEvent.createMany).toHaveBeenCalledTimes(1);
    expect(result.events).toHaveLength(1);
    expect(result.events[0].seriesId).toBeNull();
    expect(result.truncated).toBe(false);
  });

  it('preserves a multi-day span on the created event', async () => {
    const result = await createEvent('user-1', {
      ...baseInput,
      startDate: '2026-09-15',
      endDate: '2026-09-17',
    });

    expect(result.events[0].startDate).toBe('2026-09-15');
    expect(result.events[0].endDate).toBe('2026-09-17');
  });

  it('expands a recurring series preserving span, root id, and rule placement', async () => {
    const result = await createEvent('user-1', {
      ...baseInput,
      startDate: '2026-09-15',
      endDate: '2026-09-16',
      recurrenceRule: 'FREQ=WEEKLY;BYDAY=TU;COUNT=3',
    });

    expect(result.events).toHaveLength(3);
    const rootId = result.events[0].id;
    for (const event of result.events) {
      expect(event.seriesId).toBe(rootId);
    }

    const [root, ...occurrences] = result.events;
    expect(root.startDate).not.toBe(occurrences[0]?.startDate);
    for (const event of result.events) {
      const days = (Date.parse(event.endDate) - Date.parse(event.startDate)) / 86_400_000;
      expect(days).toBe(1);
    }
  });

  it('rethrows a plan foreign-key violation as PlanNotFoundError', async () => {
    prismaEvent.createMany.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('Foreign key constraint failed', {
        code: 'P2003',
        clientVersion: '6.19.3',
      }),
    );

    await expect(
      createEvent('user-1', { ...baseInput, planId: 'non-existent-plan' }),
    ).rejects.toBeInstanceOf(PlanNotFoundError);
  });

  it('rethrows unrelated errors unchanged', async () => {
    const originalError = new Error('connection lost');
    prismaEvent.createMany.mockRejectedValue(originalError);

    await expect(createEvent('user-1', baseInput)).rejects.toBe(originalError);
  });
});
