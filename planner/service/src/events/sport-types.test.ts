import { describe, expect, it } from 'vitest';

import { SPORT_TYPES } from '@common/planner-types';

import { SportType as PrismaSportType } from '../../generated/client';

// SPORT_TYPES (shared with the front end) and the Prisma enum are maintained separately;
// this fails when one is edited without the other.
describe('SPORT_TYPES', () => {
  it('matches the Prisma SportType enum', () => {
    expect([...SPORT_TYPES].sort()).toEqual(Object.values(PrismaSportType).sort());
  });
});
