import type { PlannerEvent, SportType } from '@common/planner-types';
import { request } from '@common/utils/request.util';

import { plannerServiceBase } from '../auth/url-bases';

const apiBase = `${plannerServiceBase}/api/events`;

export type ListEventsParams = {
  startDate: string;
  endDate: string;
  sportTypes?: SportType[];
};

export function listEvents(
  params: ListEventsParams,
  init?: { signal?: AbortSignal },
): Promise<PlannerEvent[]> {
  const query = new URLSearchParams();
  query.set('startDate', params.startDate);
  query.set('endDate', params.endDate);
  for (const sportType of params.sportTypes ?? []) {
    query.append('sportType', sportType);
  }

  return request<{ events: PlannerEvent[] }>(`?${query.toString()}`, {
    baseUrl: apiBase,
    signal: init?.signal,
  }).then((result) => result.events);
}
