import { useState } from 'react';

import { DEFAULT_USER_PREFERENCES } from '@common/auth-types';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { ThemeToggle } from '@common/components/ThemeToggle';
import type { PlannerEvent } from '@common/planner-types';
import { TypographyMedium } from '@common/styles/Typography';

import styles from './HomePage.module.scss';
import watermelonLogo from '../../assets/watermelon.svg';
import { useSession } from '../auth/session';
import { Calendar, type EventMoveChanges } from '../components/Calendar/Calendar';
import { UserMenu } from '../components/UserMenu/UserMenu';
import { CreateEventModal } from '../events/CreateEventModal';
import { DeleteEventModal } from '../events/DeleteEventModal';
import { DuplicateEventModal } from '../events/DuplicateEventModal';
import { EditEventModal } from '../events/EditEventModal';
import { EventDetailsModal } from '../events/EventDetailsModal';
import { browserTimeZone, updateEvent } from '../events/events-service';

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
  const { reportError } = useErrorReporter();
  const [createRequest, setCreateRequest] = useState<CreateRequest | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SelectedEvent | null>(null);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | null>(null);
  const [duplicatingEvent, setDuplicatingEvent] = useState<PlannerEvent | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<PlannerEvent | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  async function moveEvent(event: PlannerEvent, changes: EventMoveChanges) {
    try {
      await updateEvent(event.id, {
        title: event.title,
        timezone: browserTimeZone(),
        sportType: event.sportType,
        description: event.description,
        location: event.location,
        ...changes,
        scope: 'THIS_EVENT',
      });
      setReloadKey((key) => key + 1);
    } catch (error) {
      reportError(error);
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
          <ThemeToggle />
          <UserMenu
            name={user?.displayName ?? user?.username ?? ''}
            avatarIcon={user?.avatarIcon ?? null}
            avatarColor={user?.avatarColor ?? null}
            onSignOut={() => void logout()}
          />
        </nav>
      </header>
      <Calendar
        onCreateRequested={(date, time) => setCreateRequest({ date, time })}
        onEventClick={(event, anchor) => setSelectedEvent({ event, anchor })}
        onEventMove={moveEvent}
        onRecurringEventMove={(event, changes) => setEditingEvent({ ...event, ...changes })}
        reloadKey={reloadKey}
        preferences={user?.preferences ?? DEFAULT_USER_PREFERENCES}
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
          onDuplicate={() => {
            setDuplicatingEvent(selectedEvent.event);
            setSelectedEvent(null);
          }}
          onDelete={() => {
            setDeletingEvent(selectedEvent.event);
            setSelectedEvent(null);
          }}
        />
      ) : null}
      {deletingEvent ? (
        <DeleteEventModal
          event={deletingEvent}
          onClose={() => setDeletingEvent(null)}
          onDeleted={() => {
            setDeletingEvent(null);
            setReloadKey((key) => key + 1);
          }}
        />
      ) : null}
      {duplicatingEvent ? (
        <DuplicateEventModal
          event={duplicatingEvent}
          onClose={() => setDuplicatingEvent(null)}
          onCreated={() => {
            setDuplicatingEvent(null);
            setReloadKey((key) => key + 1);
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
    </main>
  );
}
