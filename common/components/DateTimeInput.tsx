import { type ComponentPropsWithoutRef, useId } from 'react';

import styles from './DateTimeInput.module.scss';
import { type InputProps } from './input-props';
import { TypographySmall } from '../styles/Typography';

export type DateTimeInputProps = {
  type: 'date' | 'time';
} & InputProps &
  Omit<
    ComponentPropsWithoutRef<'input'>,
    'id' | 'type' | 'value' | 'onChange' | 'className' | 'required'
  >;

export function DateTimeInput({
  label,
  type,
  value,
  onChange,
  error,
  required,
  className,
  ...inputProps
}: DateTimeInputProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const invalid = Boolean(error);

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      {label ? (
        <TypographySmall as="label" htmlFor={id}>
          {label}
          {required ? (
            <span className={styles.requiredAsterisk} aria-hidden="true">
              {' *'}
            </span>
          ) : null}
        </TypographySmall>
      ) : null}
      <input
        {...inputProps}
        id={id}
        type={type}
        value={value}
        className={[styles.field, invalid ? styles['-invalid'] : undefined]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={invalid}
        aria-required={required || undefined}
        aria-describedby={invalid ? errorId : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error ? (
        <TypographySmall as="p" id={errorId} className={styles.error}>
          {error}
        </TypographySmall>
      ) : null}
    </div>
  );
}
