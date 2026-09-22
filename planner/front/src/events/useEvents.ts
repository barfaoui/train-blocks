import { useEffect, useState } from 'react';

import { useErrorReporter } from '@common/components/ErrorProvider';
import type { PlannerEvent, SportType } from '@common/planner-types';

import { listEvents } from './events-service';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type UseEventsResult = {
  events: PlannerEvent[];
  loading: boolean;
  error: Error | null;
};

export function useEvents(
  range: DateRange | null,
  sportTypes?: SportType[],
  reloadKey?: number,
): UseEventsResult {
  const { reportError } = useErrorReporter();
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!range) {
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    listEvents({ ...range, sportTypes }, { signal: controller.signal })
      .then((result) => {
        setEvents(result);
        setLoading(false);
      })
      .catch((err: Error) => {
        if (err.name === 'AbortError') {
          return;
        }
        reportError(err);
        setError(err);
        setLoading(false);
      });

    return () => {
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range?.startDate, range?.endDate, sportTypes, reloadKey, reportError]);

  return { events, loading, error };
}
