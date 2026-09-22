import { type ReactNode, useState } from 'react';

import { TextInput } from '@common/components/TextInput';
import { TypographyLarge } from '@common/styles/Typography';
import { getErrorMessage } from '@common/utils/error-message.util';

import styles from './DisplayNameEditor.module.scss';
import { useSession } from '../auth/session';

const DISPLAY_NAME_MAX_LENGTH = 64;

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

const PENCIL = (
  <Icon>
    <path d="M4 20h4l10.5 -10.5a2.828 2.828 0 1 0 -4 -4l-10.5 10.5v4" />
    <path d="M13.5 6.5l4 4" />
  </Icon>
);

const CROSS = (
  <Icon>
    <path d="M18 6l-12 12" />
    <path d="M6 6l12 12" />
  </Icon>
);

const TICK = (
  <Icon>
    <path d="M5 12l5 5l10 -10" />
  </Icon>
);

export type DisplayNameEditorProps = {
  name: string;
  displayName: string | null;
  username: string;
};

export function DisplayNameEditor({ name, displayName, username }: DisplayNameEditorProps) {
  const { updateDisplayName } = useSession();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = draft.trim();
  const tooLong = trimmed.length > DISPLAY_NAME_MAX_LENGTH;
  const dirty = trimmed !== (displayName ?? '');

  function startEditing() {
    setDraft(displayName ?? '');
    setError(null);
    setEditing(true);
  }

  async function save() {
    if (!dirty || tooLong) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await updateDisplayName(trimmed);
      setEditing(false);
    } catch (saveError) {
      setError(getErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  }

  if (!editing) {
    return (
      <div className={[styles.row, styles['-reading']].join(' ')}>
        <TypographyLarge as="h1" variant="bold" className={styles.name}>
          {name}
        </TypographyLarge>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Edit display name"
          onClick={startEditing}
        >
          {PENCIL}
        </button>
      </div>
    );
  }

  return (
    <form
      className={styles.row}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setEditing(false);
        }
      }}
    >
      <TextInput
        className={styles.input}
        aria-label="Display name"
        autoFocus
        value={draft}
        placeholder={username}
        helperText="Leave it empty to use your username."
        error={tooLong ? `At most ${DISPLAY_NAME_MAX_LENGTH} characters` : (error ?? undefined)}
        onChange={setDraft}
      />
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.iconButton}
          aria-label="Discard changes"
          onClick={() => setEditing(false)}
        >
          {CROSS}
        </button>
        <button
          type="submit"
          className={[styles.iconButton, styles['-confirm']].join(' ')}
          aria-label="Save display name"
          aria-busy={saving || undefined}
          disabled={!dirty || tooLong || saving}
        >
          {TICK}
        </button>
      </div>
    </form>
  );
}
