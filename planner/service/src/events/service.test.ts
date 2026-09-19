import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createEvent, deleteEvent, updateEvent } from './service';
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
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

const prismaEvent = prisma.event as unknown as {
  createMany: ReturnType<typeof vi.fn>;
  findFirst: ReturnType<typeof vi.fn>;
  findMany: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  updateMany: ReturnType<typeof vi.fn>;
};
const prismaTransaction = prisma.$transaction as unknown as ReturnType<typeof vi.fn>;

const baseInput = {
  title: 'Morning Run',
  startDate: '2026-09-15',
  endDate: '2026-09-15',
  startTime: null,
  endTime: null,
  timezone: 'Europe/Paris',
  sportType: 'OUTSIDE_RUNNING' as const,
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
    sportType: 'OUTSIDE_RUNNING',
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
  sportType: 'OUTSIDE_RUNNING' as const,
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

  it('treats THIS_AND_FUTURE_EVENTS on a non-recurring event as a single-row update', async () => {
    prismaEvent.findFirst.mockResolvedValue(mockRow());
    prismaEvent.update.mockResolvedValue(mockRow());

    await updateEvent('user-1', 'event-1', { ...baseUpdateInput, scope: 'THIS_AND_FUTURE_EVENTS' });

    expect(prismaEvent.update).toHaveBeenCalledTimes(1);
    expect(prismaTransaction).not.toHaveBeenCalled();
  });

  it('shifts this and later occurrences by the same delta when scope is THIS_AND_FUTURE_EVENTS', async () => {
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
      scope: 'THIS_AND_FUTURE_EVENTS',
    });

    expect(prismaEvent.findMany).toHaveBeenCalledWith({
      where: { seriesId: 'root-1', deletedAt: null, startDate: { gte: root.startDate } },
    });
    expect(prismaTransaction).toHaveBeenCalledTimes(1);
    expect(result.events).toHaveLength(2);

    const shiftedRoot = result.events.find((event) => event.id === 'root-1');
    const shiftedOccurrence = result.events.find((event) => event.id === 'occ-2');
    expect(shiftedRoot?.startDate).toBe('2026-09-16');
    expect(shiftedOccurrence?.startDate).toBe('2026-09-23');
    expect(result.events.every((event) => event.title === 'Evening Run')).toBe(true);
  });

  describe('changing the recurrence', () => {
    const root = mockRow({
      id: 'root-1',
      seriesId: 'root-1',
      recurrenceRule: 'FREQ=WEEKLY;COUNT=2',
      startDate: new Date('2026-09-15T00:00:00Z'),
      endDate: new Date('2026-09-15T00:00:00Z'),
    });

    beforeEach(() => {
      prismaEvent.findFirst.mockResolvedValue(root);
      prismaEvent.findMany.mockResolvedValue([root]);
      prismaEvent.updateMany.mockReturnValue({ count: 1 });
      prismaEvent.update.mockImplementation(({ data }: { data: Record<string, unknown> }) => ({
        ...root,
        ...data,
      }));
      prismaEvent.createMany.mockReturnValue({ count: 0 });
      prismaTransaction.mockImplementation((ops: unknown[]) => Promise.all(ops));
    });

    it('regenerates the occurrences from the new rule, keeping the root row', async () => {
      const result = await updateEvent('user-1', 'root-1', {
        ...baseUpdateInput,
        scope: 'THIS_AND_FUTURE_EVENTS',
        recurrenceRule: 'FREQ=DAILY;COUNT=3',
      });

      expect(prismaEvent.updateMany).toHaveBeenCalledWith({
        where: {
          seriesId: 'root-1',
          deletedAt: null,
          startDate: { gte: root.startDate },
          id: { notIn: ['root-1', 'root-1'] },
        },
        data: { deletedAt: expect.any(Date) },
      });
      const { data: created } = prismaEvent.createMany.mock.calls[0][0] as {
        data: { startDate: Date; seriesId: string; recurrenceRule: null }[];
      };
      expect(created.length).toBeGreaterThan(0);
      expect(created.every((row) => row.seriesId === 'root-1' && row.recurrenceRule === null)).toBe(
        true,
      );
      expect(result.events[0]).toMatchObject({
        id: 'root-1',
        recurrenceRule: 'FREQ=DAILY;COUNT=3',
      });
      expect(result.events).toHaveLength(created.length + 1);
    });

    it('turns the series into a single event when the rule is null', async () => {
      const result = await updateEvent('user-1', 'root-1', {
        ...baseUpdateInput,
        scope: 'THIS_AND_FUTURE_EVENTS',
        recurrenceRule: null,
      });

      expect(prismaEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ seriesId: null, recurrenceRule: null }),
        }),
      );
      expect(prismaEvent.createMany).toHaveBeenCalledWith({ data: [] });
      expect(result.events).toHaveLength(1);
    });

    it('ignores a recurrence change when only this occurrence is edited', async () => {
      prismaEvent.update.mockResolvedValue(root);

      await updateEvent('user-1', 'root-1', {
        ...baseUpdateInput,
        scope: 'THIS_EVENT',
        recurrenceRule: 'FREQ=DAILY',
      });

      expect(prismaTransaction).not.toHaveBeenCalled();
      expect(prismaEvent.update).toHaveBeenCalledTimes(1);
    });

    it('anchors on the edited occurrence and leaves earlier ones alone', async () => {
      const edited = mockRow({
        id: 'occ-3',
        seriesId: 'root-1',
        startDate: new Date('2026-09-29T00:00:00Z'),
        endDate: new Date('2026-09-29T00:00:00Z'),
      });
      prismaEvent.findFirst.mockResolvedValue(edited);
      prismaEvent.update.mockImplementation(
        ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
          ...edited,
          id: where.id,
          ...data,
        }),
      );

      const result = await updateEvent('user-1', 'occ-3', {
        ...baseUpdateInput,
        startDate: '2026-09-29',
        endDate: '2026-09-29',
        scope: 'THIS_AND_FUTURE_EVENTS',
        recurrenceRule: 'FREQ=DAILY;COUNT=2',
      });

      expect(prismaEvent.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({
          seriesId: 'root-1',
          startDate: { gte: edited.startDate },
          id: { notIn: ['root-1', 'occ-3'] },
        }),
        data: { deletedAt: expect.any(Date) },
      });
      const { data: created } = prismaEvent.createMany.mock.calls[0][0] as {
        data: { startDate: Date }[];
      };
      expect(created.every((row) => row.startDate > edited.startDate)).toBe(true);
      expect(result.events[0]).toMatchObject({ id: 'occ-3', startDate: '2026-09-29' });
      // the stored rule lives on the root so the edit form can read it back
      expect(prismaEvent.update).toHaveBeenCalledWith({
        where: { id: 'root-1' },
        data: { recurrenceRule: 'FREQ=DAILY;COUNT=2' },
      });
    });

    it('detaches only the edited occurrence when a later one is set to not repeat', async () => {
      const edited = mockRow({ id: 'occ-3', seriesId: 'root-1' });
      prismaEvent.findFirst.mockResolvedValue(edited);
      prismaEvent.update.mockImplementation(
        ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => ({
          ...edited,
          id: where.id,
          ...data,
        }),
      );

      const result = await updateEvent('user-1', 'occ-3', {
        ...baseUpdateInput,
        scope: 'THIS_AND_FUTURE_EVENTS',
        recurrenceRule: null,
      });

      expect(prismaEvent.update).toHaveBeenCalledTimes(1);
      expect(prismaEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'occ-3' },
          data: expect.objectContaining({ seriesId: null }),
        }),
      );
      expect(result.events).toHaveLength(1);
    });

    it('never soft-deletes other one-off events when a one-off becomes a series', async () => {
      const oneOff = mockRow({ id: 'solo-1' });
      prismaEvent.findFirst.mockResolvedValue(oneOff);

      await updateEvent('user-1', 'solo-1', {
        ...baseUpdateInput,
        recurrenceRule: 'FREQ=WEEKLY;COUNT=3',
      });

      expect(prismaEvent.updateMany).toHaveBeenCalledWith({
        where: expect.objectContaining({ seriesId: 'solo-1' }),
        data: { deletedAt: expect.any(Date) },
      });
    });

    it('turns a one-off event into a series', async () => {
      const oneOff = mockRow({ id: 'solo-1' });
      prismaEvent.findFirst.mockResolvedValue(oneOff);

      const result = await updateEvent('user-1', 'solo-1', {
        ...baseUpdateInput,
        recurrenceRule: 'FREQ=WEEKLY;COUNT=3',
      });

      expect(prismaEvent.findMany).not.toHaveBeenCalled();
      expect(prismaEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            seriesId: 'solo-1',
            recurrenceRule: 'FREQ=WEEKLY;COUNT=3',
          }),
        }),
      );
      expect(result.events.length).toBeGreaterThan(1);
    });
  });
});

describe('deleteEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws EventNotFoundError when the event does not exist or is not owned by the user', async () => {
    prismaEvent.findFirst.mockResolvedValue(null);

    await expect(deleteEvent('user-1', 'missing-id', 'THIS_EVENT')).rejects.toBeInstanceOf(
      EventNotFoundError,
    );
    expect(prismaEvent.update).not.toHaveBeenCalled();
    expect(prismaEvent.updateMany).not.toHaveBeenCalled();
  });

  it('soft-deletes only the targeted row when scope is THIS_EVENT', async () => {
    prismaEvent.findFirst.mockResolvedValue(mockRow({ seriesId: 'series-1' }));

    await deleteEvent('user-1', 'event-1', 'THIS_EVENT');

    expect(prismaEvent.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaEvent.updateMany).not.toHaveBeenCalled();
  });

  it('deletes just the event when a non-recurring event is deleted with a series scope', async () => {
    prismaEvent.findFirst.mockResolvedValue(mockRow());

    await deleteEvent('user-1', 'event-1', 'ALL_EVENTS');

    expect(prismaEvent.update).toHaveBeenCalledTimes(1);
    expect(prismaEvent.updateMany).not.toHaveBeenCalled();
  });

  it('deletes this and later occurrences of the series for THIS_AND_FUTURE_EVENTS', async () => {
    const startDate = new Date('2026-09-22T00:00:00Z');
    prismaEvent.findFirst.mockResolvedValue(mockRow({ seriesId: 'series-1', startDate }));

    await deleteEvent('user-1', 'event-1', 'THIS_AND_FUTURE_EVENTS');

    expect(prismaEvent.updateMany).toHaveBeenCalledWith({
      where: { seriesId: 'series-1', deletedAt: null, startDate: { gte: startDate } },
      data: { deletedAt: expect.any(Date) },
    });
    expect(prismaEvent.update).not.toHaveBeenCalled();
  });

  it('deletes every occurrence of the series for ALL_EVENTS, including earlier ones', async () => {
    prismaEvent.findFirst.mockResolvedValue(mockRow({ seriesId: 'series-1' }));

    await deleteEvent('user-1', 'event-1', 'ALL_EVENTS');

    expect(prismaEvent.updateMany).toHaveBeenCalledWith({
      where: { seriesId: 'series-1', deletedAt: null },
      data: { deletedAt: expect.any(Date) },
    });
  });
});
