import { useState } from 'react';

import { type UserPreferences } from '@common/auth-types';
import { Button } from '@common/components/Button';
import { Checkbox } from '@common/components/Checkbox';
import { useErrorReporter } from '@common/components/ErrorProvider';
import { MultiSelect } from '@common/components/MultiSelect';
import { Select } from '@common/components/Select';
import { TextInput } from '@common/components/TextInput';
import { SPORT_TYPES } from '@common/planner-types';
import { TypographyMedium, TypographySmall } from '@common/styles/Typography';
import { type Meridiem, formatHour, to12Hour, to24Hour } from '@common/utils/time.util';

import {
  type Draft,
  type DraftErrors,
  type PreferenceCategory,
  type PreferenceField,
  changesFor,
  displayValue,
  parseList,
  toDraft,
  validateDraft,
} from './preference-fields';
import styles from './PreferenceSection.module.scss';
import { SectionCard } from './SectionCard';
import { timeZoneOptions } from './timezones';
import { useSession } from '../auth/session';
import { SportIcon } from '../components/SportIcon/SportIcon';
import { SPORT_TYPE_INFO } from '../events/sport-types';

const SPORT_OPTIONS = SPORT_TYPES.map((sportType) => ({
  value: sportType,
  label: SPORT_TYPE_INFO[sportType].label,
  icon: <SportIcon sportType={sportType} />,
}));

const NO_SPORT_OPTIONS = [{ value: '', label: 'None' }, ...SPORT_OPTIONS];

const PERIOD_OPTIONS: { value: Meridiem; label: string }[] = [
  { value: 'AM', label: 'AM' },
  { value: 'PM', label: 'PM' },
];

const HOURS_12 = Array.from({ length: 12 }, (_, index) => index + 1);

type HourFieldProps = {
  label: string;
  value: string;
  isEnd: boolean;
  use12Hour: boolean;
  error?: string;
  onChange: (value: string) => void;
};

function HourField({ label, value, isEnd, use12Hour, error, onChange }: HourFieldProps) {
  const hour24 = Number(value);

  let controls;
  if (use12Hour) {
    const { hour, period } = to12Hour(hour24);
    controls = (
      <>
        <Select
          aria-label={`${label}: hour`}
          value={String(hour)}
          options={HOURS_12.map((option) => ({ value: String(option), label: String(option) }))}
          onChange={(next) => onChange(String(to24Hour(Number(next), period, isEnd)))}
        />
        <Select
          aria-label={`${label}: AM or PM`}
          value={period}
          options={PERIOD_OPTIONS}
          onChange={(next) => onChange(String(to24Hour(hour, next as Meridiem, isEnd)))}
        />
      </>
    );
  } else {
    const hours = Array.from({ length: 24 }, (_, index) => (isEnd ? index + 1 : index));
    controls = (
      <Select
        aria-label={label}
        value={value}
        options={hours.map((hour) => ({ value: String(hour), label: formatHour(hour, false) }))}
        onChange={onChange}
      />
    );
  }

  return (
    <div className={styles.hourField}>
      <TypographySmall as="span">{label}</TypographySmall>
      <div className={styles.hourControls}>{controls}</div>
      {error ? (
        <TypographySmall as="p" className={styles.error}>
          {error}
        </TypographySmall>
      ) : null}
    </div>
  );
}

type FieldInputProps = {
  field: PreferenceField;
  draft: Draft;
  errors: DraftErrors;
  hasEmail: boolean;
  onChange: (value: string) => void;
};

function FieldInput({ field, draft, errors, hasEmail, onChange }: FieldInputProps) {
  const { kind, label } = field;
  const value = draft[field.key];

  switch (kind.type) {
    case 'select':
      return <Select label={label} value={value} options={kind.options} onChange={onChange} />;
    case 'boolean': {
      const needsEmail = field.key === 'notifyByEmail' && !hasEmail;
      return (
        <div className={styles.checkbox}>
          <Checkbox
            label={label}
            checked={value === 'true' && !needsEmail}
            disabled={needsEmail}
            onChange={(checked) => onChange(String(checked))}
          />
          {needsEmail ? (
            <TypographySmall as="p" className={styles.hint}>
              Add an email address to your account to turn this on.
            </TypographySmall>
          ) : null}
        </div>
      );
    }
    case 'number':
      return (
        <TextInput
          label={label}
          type="number"
          min={kind.min}
          max={kind.max}
          value={value}
          error={errors[field.key]}
          onChange={onChange}
        />
      );
    case 'text':
      return (
        <TextInput label={label} value={value} helperText={kind.helperText} onChange={onChange} />
      );
    case 'hour':
      return (
        <HourField
          label={label}
          value={value}
          isEnd={kind.role === 'end'}
          use12Hour={draft.timeFormat === 'H12'}
          error={errors[field.key]}
          onChange={onChange}
        />
      );
    case 'timezone':
      return (
        <Select label={label} value={value} options={timeZoneOptions(value)} onChange={onChange} />
      );
    case 'sport':
      return <Select label={label} value={value} options={NO_SPORT_OPTIONS} onChange={onChange} />;
    case 'sports':
      return (
        <MultiSelect
          className={styles.wide}
          label={label}
          options={SPORT_OPTIONS}
          value={parseList(value)}
          placeholder="No favorites yet"
          helperText="Favorites are listed first when you create an event."
          onChange={(next) => onChange(next.join(','))}
        />
      );
  }
}

export type PreferenceSectionProps = {
  category: PreferenceCategory;
  preferences: UserPreferences;
};

export function PreferenceSection({ category, preferences }: PreferenceSectionProps) {
  const [editing, setEditing] = useState(false);
  const { user, updatePreferences } = useSession();
  const { reportError } = useErrorReporter();
  const [draft, setDraft] = useState<Draft>(() => toDraft(preferences));
  const [saving, setSaving] = useState(false);

  const initial = toDraft(preferences);
  const dirty = category.fields.some((field) => draft[field.key] !== initial[field.key]);
  const errors = validateDraft(draft);
  const hasErrors = category.fields.some((field) => errors[field.key]);

  function startEditing() {
    setDraft(toDraft(preferences));
    setEditing(true);
  }

  function cancel() {
    setDraft(toDraft(preferences));
    setEditing(false);
  }

  async function save() {
    if (!dirty || hasErrors) {
      return;
    }
    setSaving(true);
    try {
      await updatePreferences(category.id, changesFor(category, initial, draft));
      setEditing(false);
    } catch (saveError) {
      reportError(saveError);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard
      title={category.title}
      description={category.description}
      actions={
        editing ? null : (
          <Button type="button" style="small" outlined label="Edit" onClick={startEditing} />
        )
      }
    >
      {editing ? (
        <form
          className={styles.form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <div className={styles.fields}>
            {category.fields.map((field) => (
              <FieldInput
                key={field.key}
                field={field}
                draft={draft}
                errors={errors}
                hasEmail={Boolean(user?.email)}
                onChange={(value) => setDraft((current) => ({ ...current, [field.key]: value }))}
              />
            ))}
          </div>
          <div className={styles.footer}>
            <Button type="button" style="small" outlined label="Cancel" onClick={cancel} />
            <Button
              type="submit"
              style="small"
              label="Save changes"
              disabled={!dirty || hasErrors}
              isLoading={saving}
            />
          </div>
        </form>
      ) : (
        <dl className={styles.list}>
          {category.fields.map((field) => (
            <div key={field.key} className={styles.row}>
              <TypographySmall as="dt" className={styles.term}>
                {field.label}
              </TypographySmall>
              <TypographyMedium as="dd" className={styles.value}>
                {displayValue(field, preferences)}
              </TypographyMedium>
            </div>
          ))}
        </dl>
      )}
    </SectionCard>
  );
}
