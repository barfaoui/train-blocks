import { useState } from 'react';

import { authsProfileHref } from '@common/app-urls';
import { ThemeToggle } from '@common/components/ThemeToggle';
import { Toast } from '@common/components/Toast';
import type { PlannerEvent } from '@common/planner-types';
import { TypographyMedium, TypographySmall } from '@common/styles/Typography';

import styles from './HomePage.module.scss';
import watermelonLogo from '../../assets/watermelon.svg';
import { useSession } from '../auth/session';
import { authsFrontBase } from '../auth/url-bases';
import { Calendar, type EventMoveChanges } from '../components/Calendar/Calendar';
import { CreateEventModal } from '../events/CreateEventModal';
import { EditEventModal } from '../events/EditEventModal';
import { EventDetailsModal } from '../events/EventDetailsModal';
import { updateEvent } from '../events/events-service';

const profileHref = authsProfileHref(authsFrontBase);

export type CreateRequest = {
  date: string;
  time?: string;
};

type SelectedEvent = {
  event: PlannerEvent;
  anchor: DOMRect;
};

export function HomePage() {
  const { user, logout } = useSession();
  const [createRequest, setCreateRequest] = useState<CreateRequest | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [moveError, setMoveError] = useState<string | null>(null);

  async function moveEvent(event: PlannerEvent, changes: EventMoveChanges) {
    try {
      await updateEvent(event.id, {
        title: event.title,
        timezone: event.timezone,
        sportType: event.sportType,
        description: event.description,
        location: event.location,
        ...changes,
        scope: 'THIS_EVENT',
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      setMoveError(error instanceof Error ? error.message : 'Failed to move event');
      throw error;
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <img src={watermelonLogo} alt="" className={styles.logoMark} />
          <div className={styles.brandText}>
            <TypographyMedium as="h1" className={styles.greeting}>
              Hello, {user?.username}
            </TypographyMedium>
          </div>
        </div>
        <nav className={styles.headerActions}>
          <TypographySmall
            as="button"
            type="button"
            className={styles.signOutButton}
            onClick={() => void logout()}
          >
            Sign out
          </TypographySmall>
          <TypographySmall
            as="a"
            variant="bold"
            href={profileHref}
            className={styles.profileButton}
          >
            Profile
          </TypographySmall>
          <ThemeToggle />
        </nav>
      </header>
      <Calendar
        onCreateRequested={(date, time) => setCreateRequest({ date, time })}
        onEventClick={(event, anchor) => setSelectedEvent({ event, anchor })}
        onEventMove={moveEvent}
        // The edit form lets the user pick whether the change applies to the whole series.
        onRecurringEventMove={(event, changes) => setEditingEvent({ ...event, ...changes })}
        reloadKey={reloadKey}
      />
      {createRequest ? (
        <CreateEventModal
          initialDate={createRequest.date}
          initialTime={createRequest.time}
          onClose={() => setCreateRequest(null)}
          onCreated={() => {
            setCreateRequest(null);
            setReloadKey((key) => key + 1);
          }}
        />
      ) : null}
      {selectedEvent ? (
        <EventDetailsModal
          event={selectedEvent.event}
          anchor={selectedEvent.anchor}
          onClose={() => setSelectedEvent(null)}
          onEdit={() => {
            setEditingEvent(selectedEvent.event);
            setSelectedEvent(null);
          }}
        />
      ) : null}
      {editingEvent ? (
        <EditEventModal
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onUpdated={() => {
            setEditingEvent(null);
            setReloadKey((key) => key + 1);
          }}
        />
      ) : null}
      {moveError ? (
        <Toast message={moveError} variant="error" onClose={() => setMoveError(null)} />
      ) : null}
    </main>
  );
}
