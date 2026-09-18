import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEvent, updateEvent } from './service';
import { Prisma } from '../../generated/client';
import { prisma } from '../data/prisma';
import { EventNotFoundError, PlanNotFoundError } from '../data/types/errors';

vi.mock('../data/prisma', () => ({
  prisma: {
    event: {
      createMany: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const prismaEvent = prisma.event as unknown as {
  createMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
};
const prismaTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

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

function mockRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'event-1',
    title: 'Morning Run',
    startDate: new Date('2026-09-15T00:00:00Z'),
    endDate: new Date('2026-09-15T00:00:00Z'),
    startTime: null,
    endTime: null,
    timezone: 'Europe/Paris',
    sportType: 'RUNNING',
    description: null,
    location: null,
    seriesId: null,
    planId: null,
    ...overrides,
  };
}

const baseUpdateInput = {
  title: 'Evening Run',
  startDate: '2026-09-15',
  endDate: '2026-09-15',
  startTime: null,
  endTime: null,
  timezone: 'Europe/Paris',
  sportType: 'RUNNING' as const,
  description: null,
  location: null,
  scope: 'THIS_EVENT' as const,
};

describe('updateEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws EventNotFoundError when the event does not exist or is not owned by the user', async () => {
    prismaEvent.findFirst.mockResolvedValue(null);

    await expect(updateEvent('user-1', 'missing-id', baseUpdateInput)).rejects.toBeInstanceOf(
      EventNotFoundError,
    );
    expect(prismaEvent.update).not.toHaveBeenCalled();
  });

  it('updates only the targeted row when scope is THIS_EVENT', async () => {
    prismaEvent.findFirst.mockResolvedValue(mockRow());
    prismaEvent.update.mockResolvedValue(mockRow({ title: 'Evening Run' }));

    const result = await updateEvent('user-1', 'event-1', baseUpdateInput);

    expect(prismaEvent.update).toHaveBeenCalledTimes(1);
    expect(prismaEvent.findMany).not.toHaveBeenCalled();
    expect(prismaTransaction).not.toHaveBeenCalled();
    expect(result.events).toHaveLength(1);
    expect(result.events[0].title).toBe('Evening Run');
  });

  it('treats ALL_EVENTS on a non-recurring event as a single-row update', async () => {
    prismaEvent.findFirst.mockResolvedValue(mockRow());
    prismaEvent.update.mockResolvedValue(mockRow());

    await updateEvent('user-1', 'event-1', { ...baseUpdateInput, scope: 'ALL_EVENTS' });

    expect(prismaEvent.update).toHaveBeenCalledTimes(1);
    expect(prismaTransaction).not.toHaveBeenCalled();
  });

  it('shifts every occurrence in the series by the same delta when scope is ALL_EVENTS', async () => {
    const root = mockRow({
      id: 'root-1',
      seriesId: 'root-1',
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-09-15T00:00:00Z'),
    });
    const occurrence = mockRow({
      id: 'occ-2',
      seriesId: 'root-1',
      startDate: new Date('2026-09-22T00:00:00Z'),
      endDate: new Date('2026-09-22T00:00:00Z'),
    });

    prismaEvent.findFirst.mockResolvedValue(root);
    prismaEvent.findMany.mockResolvedValue([root, occurrence]);
    prismaEvent.update.mockImplementation(
      ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
        ...mockRow(),
        id: where.id,
        seriesId: 'root-1',
        ...data,
      }),
    );
    prismaTransaction.mockImplementation((ops: unknown[]) => Promise.all(ops));

    // Editing the root occurrence one day later than its current date; every
    // other occurrence in the series should move by that same one-day delta.
    const result = await updateEvent('user-1', 'root-1', {
      ...baseUpdateInput,
      startDate: '2026-09-16',
      endDate: '2026-09-16',
      scope: 'ALL_EVENTS',
    });

    expect(prismaTransaction).toHaveBeenCalledTimes(1);
    expect(result.events).toHaveLength(2);

    const shiftedRoot = result.events.find((event) => event.id === 'root-1');
    const shiftedOccurrence = result.events.find((event) => event.id === 'occ-2');
    expect(shiftedRoot?.startDate).toBe('2026-09-16');
    expect(shiftedOccurrence?.startDate).toBe('2026-09-23');
    expect(result.events.every((event) => event.title === 'Evening Run')).toBe(true);
  });
});
