import { type ComponentPropsWithoutRef, useId } from 'react';

import styles from './Textarea.module.scss';
import { TypographySmall } from '../styles/Typography';

export type TextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  className?: string;
} & Omit<
  ComponentPropsWithoutRef<'textarea'>,
  'id' | 'value' | 'onChange' | 'className' | 'required'
>;

export function Textarea({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  rows = 3,
  className,
  ...textareaProps
}: TextareaProps) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const invalid = Boolean(error);
  const describedBy = [helperText ? helperId : undefined, invalid ? errorId : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={[styles.root, className].filter(Boolean).join(' ')}>
      <TypographySmall as="label" htmlFor={id}>
        {label}
        {required ? (
          <span className={styles.requiredAsterisk} aria-hidden="true">
            {' *'}
          </span>
        ) : null}
      </TypographySmall>
      <textarea
        {...textareaProps}
        id={id}
        rows={rows}
        value={value}
        className={[styles.field, invalid ? styles['-invalid'] : undefined]
          .filter(Boolean)
          .join(' ')}
        aria-invalid={invalid}
        aria-required={required || undefined}
        aria-describedby={describedBy || undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {helperText ? (
        <TypographySmall as="p" id={helperId} className={styles.helper}>
          {helperText}
        </TypographySmall>
      ) : null}
      {error ? (
        <TypographySmall as="p" id={errorId} className={styles.error}>
          {error}
        </TypographySmall>
      ) : null}
    </div>
  );
}
