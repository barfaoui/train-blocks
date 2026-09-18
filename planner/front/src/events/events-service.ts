import type {
  CreateEventBody,
  CreateEventResponse,
  PlannerEvent,
  SportType,
  UpdateEventBody,
  UpdateEventResponse,
} from '@common/planner-types';
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

export function createEvent(body: CreateEventBody): Promise<CreateEventResponse> {
  return request<CreateEventResponse>('', {
    baseUrl: apiBase,
    method: 'POST',
    body: JSON.stringify(body),
    parseError: eventsApiErrorFrom,
  });
}

export function updateEvent(eventId: string, body: UpdateEventBody): Promise<UpdateEventResponse> {
  return request<UpdateEventResponse>(`/${eventId}`, {
    baseUrl: apiBase,
    method: 'PATCH',
    body: JSON.stringify(body),
    parseError: eventsApiErrorFrom,
  });
}

async function eventsApiErrorFrom(response: Response): Promise<Error> {
  let message = response.statusText || `Request failed with status ${response.status}`;
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) {
      message = body.error;
    }
  } catch {
    // non-JSON error body
  }
  return new Error(message);
}
